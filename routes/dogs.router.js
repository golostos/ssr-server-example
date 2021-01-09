const express = require('express')
const dogsRouter = express.Router()
const { Dog } = require('../models')
const dogsValidator = require('../validators/dogs.validator')

// API http
// routing
// Restful API (CRUD)
// C - create R - read U - update D - delete
// C - POST (HTTP)
// R - GET (HTTP)
// U - PATCH/PUT (HTTP)
// D - DELETE (HTTP)

dogsRouter.get('/', async (req, res) => {
    const dogs = await Dog.findAll()
    res.send(dogs)
})

dogsRouter.get('/:dogId', async (req, res) => {
    const dogId = req.params.dogId
    const dog = await Dog.findOne({
        where: {
            id: dogId
        }
    })
    if (dog) res.send(dog)
    else res.status(404).send(`Can't find a dog with id ${dogId}`)
})

/**
 * В роут ниже добавляем middleware функции dogsValidator. Эти функции проводят валидацию данных из
 * Http body запроса и если валидация прошла хорошо, то уже запускается RequestHandler, который
 * сохраняет собачку в БД
 */
dogsRouter.post('/', dogsValidator, 
    // Конструкция ниже явно задает тип функции как RequestHandler из express. Помогает при наборе
    // кода в VS Code. RequestHandler это и есть middleware функция.
    /** @type {import("express").RequestHandler} */
    async (req, res) => {
        const { name, breed, age } = req.body
        const dog = await Dog.create({ name, breed, age })
        res.send(dog)
})

dogsRouter.patch('/:dogId', dogsValidator, 
    /** @type {import("express").RequestHandler} */
    async (req, res) => {
        const dogId = req.params.dogId
        const updatedDog = req.body
        const result = await Dog.update(updatedDog, {
            where: {
                id: dogId
            }
        })
        if (result[0]) res.send({ message: "Successful update" })
        else res.status(404).send(`Can't find a dog with id ${dogId}`)
})

dogsRouter.delete('/:dogId', async (req, res) => {
    const dogId = +req.params.dogId
    const result = await Dog.destroy({
        where: {
            id: dogId
        }
    })
    if (result) {
        res.send({
            message: "Successful destroy"
        })
    } else {
        res.status(404).send(`Can't find a dog with id ${dogId}`)
    }
})

module.exports = dogsRouter