const path = require('path')
// Проверяем существование и значение process.env.NODE_ENV. 
// В зависимости от этого устанавливаем имя хоста 
// (используется тернарный оператор: https://learn.javascript.ru/ifelse#uslovnyy-operator)
const origin = (process.env.NODE_ENV && process.env.NODE_ENV === 'development') ? 
    'http://localhost' : 'http://user08.test1.seschool.ru'

/**
 * @property {string} html Полное имя html файла
 * @property {string} static Полное имя папки для static сервера (html, js, css, изображения и т.д.)
 * @property {string} origin Полное имя хоста нашего сервера
 */
const CONFIG = {
    // Полное имя html файла
    html: path.join(__dirname, './client/dogs/index.html'),
    // Полное имя папки для static сервера (html, js, css, изображения и т.д.)
    static: path.join(__dirname, './client/dogs/'),
    // Полное имя хоста нашего сервера
    origin: `${origin}:${process.env.PORT}`
}

module.exports = CONFIG