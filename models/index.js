// @ts-check
const { Sequelize } = require('sequelize')
const dogInit = require('./Dog')

// Настройки БД получаем из переменных окружения
const sequelize = new Sequelize(process.env.DB, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql'
});

const Dog = dogInit(sequelize)

module.exports = {
    sequelize,
    Dog
}