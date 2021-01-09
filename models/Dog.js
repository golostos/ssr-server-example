// @ts-check
const { DataTypes, Sequelize } = require('sequelize')

/**
 * Init Dog model for Sequelize
 * @param {Sequelize} sequelize
 */
function dogInit(sequelize) {
    const DogModel = sequelize.define('Dog', {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        breed: {
            type: DataTypes.STRING,
            allowNull: false
        },
        age: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {})
    return DogModel
}

module.exports = dogInit