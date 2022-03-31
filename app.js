const path = require('path')
const fs = require('fs/promises')
const cors = require('cors')
const express = require('express')
const { v4: uuidv4 } = require('uuid')

const app = express()
app.use(express.json())
app.use(cors())

async function getUsersList() {
    const usersList = await fs.readFile(path.join(__dirname, 'db.json'), { encoding: 'utf-8' })
    return JSON.parse(usersList)
}

async function getUserById(id) {
    const userList = await getUsersList()
    return userList.find(user => user.id === id)
}

async function isUserExists(email) {
    const userList = await getUsersList()
    return userList.findIndex(user => user.email === email || user.username === email) !== -1
}

app.get('/users', async (req, res) => {
    const usersList = await getUsersList()
    res.status(200).json({
        total: usersList.length,
        message: 'success',
        users: usersList,
    })
})

app.get('/users/:id', async (req, res) => {
    const id = req.params.id
    const user = await getUserById(id)

    if (user) {
        return res.status(200).json({
            total: 1,
            message: 'Success',
            user
        })
    }

    res.status(400).json({
        total: 0,
        message: 'User not found'
    })
})

app.post('/create', async (req, res) => {
    const { first_name, last_name, email, phone_number, birthdate, username } = req.body

    if (!first_name.trim()) return res.status(400).json({ message: 'Firstname is required' })
    if (!last_name.trim()) return res.status(400).json({ message: 'Lastname is required' })
    if (!email.trim()) return res.status(400).json({ message: 'Email is required' })
    if (!phone_number.trim()) return res.status(400).json({ message: 'Phone is required' })
    if (!birthdate) return res.status(400).json({ message: 'Birthdate is required' })
    if (!username.trim()) return res.status(400).json({ message: 'Username is required' })

    let exists = await isUserExists(email)
    exists = await isUserExists(username)

    if (exists) {
        return res.status(400).json({
            message: 'Email or username already exists'
        })
    }
    const userList = await getUsersList()
    userList.push({
        id: uuidv4(),
        ...req.body
    })
    await fs.writeFile(path.join(__dirname, 'db.json'), JSON.stringify(userList))

    res.status(201).json({
        total: userList.length,
        message: 'New user created',
        users: userList
    })
})

app.post('/edit', async (req, res) => {
    const { id, first_name, last_name, email, phone_number, birthdate, username } = req.body

    if (!id) return res.status(400).json({ message: 'Id is required' })
    if (!first_name.trim()) return res.status(400).json({ message: 'Firstname is required' })
    if (!last_name.trim()) return res.status(400).json({ message: 'Lastname is required' })
    if (!email.trim()) return res.status(400).json({ message: 'Email is required' })
    if (!phone_number.trim()) return res.status(400).json({ message: 'Phone is required' })
    if (!birthdate) return res.status(400).json({ message: 'Birthdate is required' })
    if (!username.trim()) return res.status(400).json({ message: 'Username is required' })

    const user = await getUserById(id)
    if (!user) {
        return res.status(400).json({
            message: 'User not found'
        })
    }

    const userList = await getUsersList()
    const index = userList.findIndex(u => u.id === user.id)
    userList[index] = req.body
    await fs.writeFile(path.join(__dirname, 'db.json'), JSON.stringify(userList))

    res.status(201).json({
        total: userList.length,
        message: 'User edited',
        users: userList
    })
})

app.delete('/delete/:id', async (req, res) => {
    const userList = await getUsersList()
    const index = userList.findIndex(u => u.id === req.params.id)

    if (index === -1) {
        return res.status(400).json({
            message: 'User not found'
        })
    }

    userList.splice(index, 1)

    await fs.writeFile(path.join(__dirname, 'db.json'), JSON.stringify(userList))

    res.status(200).json({
        total: userList.length,
        message: 'User deleted',
        users: userList
    })
})

app.listen(3000, () => {
    console.log('SERVER IS LISTENING AT PORT: http://localhost:3000')
})