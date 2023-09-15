// Required modules
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Create an Express app
const app = express();

// Middleware setup
app.use(cors()); // This allows for cross-origin requests
app.use(bodyParser.json()); // Parse JSON request body
app.use(bodyParser.urlencoded({ extended: true })); // Parse x-www-form-urlencoded request body

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'servergop.mysql.database.azure.com', // Your Azure MySQL host URL
    user: 'boss', // Your Azure MySQL user
    password: 'Server@spb.cat', // Your Azure MySQL password
    database: 'appmovil', // Your Azure MySQL database name
    ssl: {
        ca: fs.readFileSync(path.join(__dirname, 'DigiCertGlobalRootCA.crt.pem'))

    }
});

// Connect to MySQL database
db.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
    console.log('Connected to MySQL as thread id:', db.threadId);
});

// Simple route for testing
app.get('/', (req, res) => {
    res.send('Hello from the server!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Obtener todas las obras
app.get('/obras', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM obras');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Insertar una nueva obra
app.post('/obras', async (req, res) => {
    const { nombre } = req.body;
    try {
        const [result] = await db.query('INSERT INTO obras (nombre) VALUES (?)', [nombre]);
        res.json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Borrar una obra
app.delete('/obras/:id', async (req, res) => {
    const idObra = req.params.id;
    try {
        await db.query('DELETE FROM obras WHERE idObra = ?', [idObra]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los proveedores
app.get('/proveedores', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM proveedores');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Insertar un nuevo proveedor
app.post('/proveedores', async (req, res) => {
    const { proveedor } = req.body;
    try {
        const [result] = await db.query('INSERT INTO proveedores (proveedor) VALUES (?)', [proveedor]);
        res.json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Borrar un proveedor
app.delete('/proveedores/:id', async (req, res) => {
    const idProveedor = req.params.id;
    try {
        await db.query('DELETE FROM proveedores WHERE idProveedor = ?', [idProveedor]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todas las imágenes
app.get('/imagenes', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM imagenes');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Insertar una nueva imagen
app.post('/imagenes', async (req, res) => {
    const { url, proveedorId, obraId } = req.body;
    try {
        const [result] = await db.query('INSERT INTO imagenes (url, proveedorId, obraId) VALUES (?, ?, ?)', [url, proveedorId, obraId]);
        res.json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Borrar una imagen
app.delete('/imagenes/:id', async (req, res) => {
    const imagenId = req.params.id;
    try {
        await db.query('DELETE FROM imagenes WHERE imagenId = ?', [imagenId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los registros de proveedores_obras
app.get('/proveedores_obras', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM proveedores_obras');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Insertar un nuevo registro en proveedores_obras
app.post('/proveedores_obras', async (req, res) => {
    const { proveedor_id, obra_id } = req.body;
    try {
        const [result] = await db.query('INSERT INTO proveedores_obras (proveedor_id, obra_id) VALUES (?, ?)', [proveedor_id, obra_id]);
        res.json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Borrar un registro de proveedores_obras
app.delete('/proveedores_obras/:id', async (req, res) => {
    const proveedor_obra_id = req.params.id;
    try {
        await db.query('DELETE FROM proveedores_obras WHERE proveedor_obra_id = ?', [proveedor_obra_id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los usuarios
app.get('/usuarios', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM usuarios');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Insertar un nuevo usuario
app.post('/usuarios', async (req, res) => {
    const { nombre, apellido, usuario, contrasena, mail } = req.body;
    try {
        const [result] = await db.query('INSERT INTO usuarios (nombre, apellido, usuario, contrasena, mail) VALUES (?, ?, ?, ?, ?)', [nombre, apellido, usuario, contrasena, mail]);
        res.json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Borrar un usuario
app.delete('/usuarios/:id', async (req, res) => {
    const idUsuario = req.params.id;
    try {
        await db.query('DELETE FROM usuarios WHERE idUsuario = ?', [idUsuario]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



