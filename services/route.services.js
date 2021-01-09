// Подключаем fetch для NodeJS
const fetch = require('node-fetch').default

/**
 * Функция генерирует строку querystring с ошибками и правильными свойствами из body.
 * querystring это часть URL для передачи данных: https://en.wikipedia.org/wiki/Query_string 
 * Функция принимает объект body с данными для записи в БД, а также массив errors, полученный
 * после валидации. В этом массиве перечисляются не валидные свойства из body
 * @param {Object} body 
 * @param {Array} errors 
 */
function createQueryStr(body, errors) {
    // Делаем копию объекта body, чтобы испортить оригинальный body
    const correct = { ...body }
    // Перебираем массив errors
    errors.forEach(err => {
        // Если в correct есть свойство значение ключа которого записано в массиве errors, то
        // удаляем его из объекта correct
        if (correct[err.param] !== undefined) delete correct[err.param]
    })
    // Преобразуем объекты в JSON с помощью JSON.stringify и потом с помощью encodeURIComponent
    // кодируем JSON в кодировке urlencode. Получившиеся строки можно использовать как часть URL в
    // формате querystring. Это очень частый способ передачи данных между клиентом и сервером в сайтах,
    // где нет API и каждый запрос на обновление данных на странице приводил к обновлению страницы
    // в браузере. Так работают большинство старых сайтов на PHP. Так как наш сайт должен работать в
    // том числе и при отключенном JS в браузере мы должны сделать также. 
    const errorsJSON = encodeURIComponent(JSON.stringify(errors));
    const correctJSON = encodeURIComponent(JSON.stringify(correct));
    return `?errors=${errorsJSON}&correct=${correctJSON}`
}

/**
 * Превращает объект извлеченный из querystring средствами express обратно в строку
 * @param {Object} query 
 */
function getQueryStr(query) {
    return (query.errors ? ('?errors=' + query.errors) : '') +
        (query.correct ? ('&correct=' + query.correct) : '')
}

/**
 * Удаляется знак / на конце URL
 * @param {string} originalUrl 
 */
function dropLastChar(originalUrl) {
    return originalUrl.slice(-1) === '/' ? originalUrl.slice(0, -1) : originalUrl
}

/**
 * Метод для осуществления запроса на сервере NodeJS к нашему API. Т.е. делаем запрос не из браузера
 * к серверному API, а с сервера к серверному API. Так тоже можно делать (такой подход очень часто 
 * используется в микросервисной архитектуре)
 * @param {string} method Метод Http запроса
 * @param {string} url URL по которому делаем запрос
 * @param {Object} body Объект с телом запроса
 */
function request(method, url, body) {
    return fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    })
}

module.exports = {
    createQueryStr,
    getQueryStr,
    dropLastChar,
    request
}