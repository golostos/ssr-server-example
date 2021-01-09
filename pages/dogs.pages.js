const express = require('express')
const dogsPages = express.Router()
// Читаем комментарии в файле конфига ниже
const CONFIG = require('../config')

const SSRResourceConstructor = require('ssr-render-page')
// Вспомогательные функции, которые можно использовать для роутингов разных ресурсов (не только
// собачек) вынесены в отдельный файл route.services.js
const { dropLastChar, getQueryStr, request, createQueryStr } = require('../services/route.services')

// Как вы можете заметить по коду ниже и по коду в script.js (браузерный JS), всё управление нашим
// приложением происходит при помощи роутинга. Функция renderDogs получает URL страницы, которую
// надо отрисовать. Когда браузерный JS запускается, или на сервере или в браузере, он информацию о
// странице, которую надо отрендерить в этот момент, получает из переменной location. При серверном
// рендеринге значение location мы определяем значением параметра, передаваемого в функцию renderDogs
/**
 * Функция для рендера страниц на базе URL 
 * @type {import("ssr-render-page").renderPage} Импортируем явно тип
 * */
let renderDogs

/**
 * Функция запуска SSR конструктора для ресурса /dogs
 * Генерирует функцию renderDogs, которая позволяет рендерить любые страницы для URL, начиющийся с
 * http://localhost:4000/dogs/ (для режима разработки)
 * @param {import("http").Server} server Http server для прикрепления к нему live reload
 */
function passServerToDogs(server) {
    renderDogs = SSRResourceConstructor({
        origin: CONFIG.origin,
        resourceName: '/dogs',
        htmlFile: CONFIG.html,
        // Проверяем режим запуска приложения (для разработки или на сервере)
        development: (process.env.NODE_ENV && process.env.NODE_ENV === 'development') ? true : false,
        server
    })
}

// ################ Начало роутов, готорые производят SSR рендер страниц ################

// Роут для корня нашего SSR ресурса http://localhost:4000/dogs/
dogsPages.get('/', async (req, res) => {
    // Проверяем чтобы URL обязятельно заканчивался на знак "/". Иначе делаем переадресацию браузера
    // на тот же URL + /. Т.е. http://localhost:4000/dogs переадресует на http://localhost:4000/dogs/
    // Это связано с тем, что / в конце URL говорит браузеру о том, что мы находимся якобы в папке
    // dogs и когда браузер будет запрашивать другие ресурсы (скрипты, стили, картинки) он будет их
    // искать именно в этой папке. Например: http://localhost:4000/dogs/style.css
    // Если / нет, то dogs по мнению браузера это имя файла или странички и другие ресурсы браузер
    // будет запрашивать из корня сайта (например http://localhost:4000/style.css)
    // Нам необходимо, чтобы весь SSR происходил именно в http://localhost:4000/dogs/
    // Конструкция /\/$/ это регулярное выражение. С помощью него мы проверяем соответствие URL
    // шаблону в регулярном выражении: https://developer.mozilla.org/ru/docs/Web/JavaScript/Reference/Global_Objects/RegExp
    if (!(/\/$/.test(req.originalUrl))) return res.redirect(req.originalUrl + '/')
    // С помощью деструктуризации получаем html и statusCode после рендера страницы /
    const { html, statusCode } = await renderDogs('/')
    // Отправляем страницу в браузер
    res.status(statusCode).send(html)
})

// Для всех остальных URL мы должны наоборот на конце URL обрезать лишний /, чтобы браузер по
// прежнему считал, что он работает с папкой dogs. Этот роут принимает middleware функцию, которая
// для всех остальных get роутов ниже производит редирект (переадресацию браузера) на URL без / на конце
// Данный роут в силу специфики функции use сработает для всех URL, которые начинаются с http://localhost:4000/dogs
dogsPages.use((req, res, next) => {
    // Проверяем, что метод запроса GET и регулярка совпала с URL. Тогда делаем редирект
    if (req.method === 'GET' && /\/$/.test(req.originalUrl)) res.redirect(req.originalUrl.slice(0, -1))
    // Если нет, то переходим к одному из роутов ниже по коду
    else next()
})

// Роут для рендера страницы с конкретной собачкой
dogsPages.get('/:id', async (req, res, next) => {
    const id = req.params.id
    // Проверяем, чтобы id был числом, поскольку под шаблон /:id попадет как /100, так и /script.js,
    // а нам нужно чтобы такие вещи уже обрабатывались статик сервером
    if (!isNaN(+id)) {
        const { html, statusCode } = await renderDogs(`/${id}`)
        res.status(statusCode).send(html)
    }
    // если id не число управление передается роутам ниже
    else next()
})

// Роут для рендера страницы для редактирования конкретной собачки
dogsPages.get('/:id/edit', async (req, res, next) => {
    const id = req.params.id
    // также проверяем id
    if (!isNaN(+id)) {
        // функция getQueryStr возвращает нам строку с querystring, в которых содержатся данные об
        // ошибках валидации при создании или редактировании собачки, а также корректные данные.
        // Этот querystring передаем в renderDogs для генерации страницы редактирования собаки.
        // querystring будут использоваться только в том случае, если у пользователя отключен JS в
        // браузере. Тогда при рендере на сервере браузерный скрипт сразу сгенерирует страницу с формой, в
        // которой будут указаны ошибки и правильные значения. Этот html с ошибками в готовом виде придет в
        // браузер пользователя. Таким образом раньше работали PHP сайты при обработке ошибок формы.
        const { html, statusCode } = await renderDogs(`/${id}/edit` + getQueryStr(req.query))
        res.status(statusCode).send(html)
    }
    else next()
})

// Роут для рендера страницы для создания новой собачки
dogsPages.get('/new', async (req, res) => {
    // Здесь getQueryStr аналогично используется для передачи данных об ошибках в браузерный скрипт,
    // когда этот скрипт рендерится на сервере. Если JS в браузере включен, то querystring в
    // renderDogs не попадет
    const { html, statusCode } = await renderDogs('/new' + getQueryStr(req.query))
    res.status(statusCode).send(html)
})

// Роут для рендера страницы 404
dogsPages.get('/page-404', async (req, res) => {
    // Если при обращению к этому роуту в URL есть querystring, то свойство message из этого
    // querystring передастся в браузерный JS, который рендерится на сервере. Браузерный JS получит
    // message также через querystring
    const query = (req.query.message ? ('?message=' + req.query.message) : '')
    const { html, statusCode } = await renderDogs('/page-404' + query)
    res.status(statusCode).send(html)
})

// ################ Конец роутов, готорые производят SSR рендер страниц ################

// Роутинг для статичных файлов (JS, CSS, изображения). Первым параметром [/^\/\d+/, '/'] передаем
// правила идентификации URL по которым будут отдаваться файлы. /^\/\d+/ это регулярка для отдачи
// файлов при обращении по http://localhost:4000/dogs/ЧИСЛО . Это необходимо для страницы
// редактирования конкретной собачки, поскольку после её рендера и отправки в браузер, браузер будет
// пытаться загрузить скрипты и стили из папки http://localhost:4000/dogs/ЧИСЛО/ . В этом случае мы
// будем отдавать браузеру файлы из CONFIG.static. Второй элемент массива '/' будет запускать
// статический сервер для всех обращений к http://localhost:4000/dogs/ , но только в том случае,
// если ни один из роутов выше по коду не сработал, или если в роутах выше был вызван next
dogsPages.use([/^\/\d+/, '/'], express.static(CONFIG.static))

// Этот роут сработает только если у пользователя отключен JS в браузере. В этом случае при нажатии
// в браузере кнопки submit в форме создания собачки на сервер пойдет POST запрос с данными из формы
// в формате "application/x-www-form-urlencoded". Обратите внимание, что когда JS в браузере
// работает, то данные из формы мы посылали в формате JSON. Для старых сайтов без JS как раз и были
// придуманы html формы, которые автоматически посылали свои данные на сервер в x-www-form-urlencoded
// формате. Этот роут заменяет собой в данном случае аналогичный роут из API. API работает только
// когда в браузере включен JS и используется метод fetch
dogsPages.post('/', async (req, res) => {
    const response = await request('POST', `${CONFIG.origin}/api/dog`, req.body)
    if (response.ok) res.redirect(req.originalUrl)
    else if (response.status === 400) {
        const { errors } = await response.json()
        const query = createQueryStr(req.body, errors)
        res.redirect(`${dropLastChar(req.originalUrl)}/new${query}`)
    }
})

dogsPages.post('/:id/edit', async (req, res) => {
    const id = req.params.id
    const response = await request('PATCH', `${CONFIG.origin}/api/dog/${id}`, req.body)    
    if (response.ok) { }
    else if (response.status === 404) {
        res.redirect(`${dropLastChar(req.originalUrl)}/page-404?message=` +
            encodeURIComponent(`Can't find a dog with id ${id}`))
    } else if (response.status === 400) {
        const { errors } = await response.json()
        const query = createQueryStr(req.body, errors)
        res.redirect(`${dropLastChar(req.originalUrl)}${query}`)
    }
})

module.exports = {
    dogsPages,
    passServerToDogs
}
