// Пакет dotenv используется чтобы взять переменные окружения из файла под именем ".env" и добавляет
// эти переменные в глобальный объект process. process доступен из любого файла в NodeJS. Теперь к
// переменным мы можем обращаться так: process.env.НАЗВАНИЕ_ПЕРЕМЕННОЙ_ИЗ_.ENV_ФАЙЛА
// Кроме того, переменные окружения мы можем добавлять через пакет cross-env. Пример есть в файле
// package.json в задаче dev. Через cross-env мы передаем переменную NODE_ENV, которая указывает,
// что мы запускаем наше приложение в режиме разработки. Вообще переменные окружения это переменные,
// которые задаются операционной системой вне нашего приложения. Именно с помощью переменных
// окружения рекомендуется передавать какие-то секретные конфигурационные данные в наше приложение,
// чтобы это не попадало в репозиторий. Например настройки для доступа к БД или секретные токены.
// Пример ".env" файла приведен в ".env.example" файле. Надо переименовать файл и подставить свои
// значения по настройке доступа к БД
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const dogsRouter = require('./routes/dogs.router')
// Ниже используется синтаксис деструктуризации: https://learn.javascript.ru/destructuring
const { sequelize } = require('./models')
const { dogsPages, passServerToDogs } = require('./pages/dogs.pages')

async function sync() {
    await sequelize.authenticate()
    console.log('Successful connection')
    await sequelize.sync()
    console.log('Successful sync')
}
sync()

// Добавляем middleware обработчик для извлечения данных из body запроса в формате JSON
app.use(express.json())
// Добавляем middleware обработчик для извлечения данных из body запроса в формате
// "application/x-www-form-urlencoded". Это формат передачи данных из html форм на сервер
app.use(bodyParser.urlencoded({ extended: false }))

app.get('/', (req, res) => {
    res.send('App root')
})

// Здесь подключаем роутер для API. К API делаем запросы с данными о собачках по http протоколу
app.use('/api/dog', dogsRouter)

// Это роутер для страниц с собачками. Страницы уже будут показываться в браузере (при помощи SSR)
app.use('/dogs', dogsPages)

// Сохраняем объект Http сервера 
const server = app.listen(process.env.PORT, () => {
    console.log(`Server started at http://localhost:${process.env.PORT}`)
})

// Передаем объект сервера в SSR. Это необходимо для организации авто перезагрузки страницы
passServerToDogs(server)