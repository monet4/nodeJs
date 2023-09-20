    // Required modules
    const express = require('express');
    const bodyParser = require('body-parser');
    const mysql = require('mysql2/promise');
    const cors = require('cors');
    const fs = require('fs');
    const path = require('path');
    const multer = require('multer');
    const { BlobServiceClient } = require('@azure/storage-blob');
    
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerName = "appalbaran"; 
    const decodedCert = Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64');
    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });
    
    // Create an Express app
    const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Database Connection
let pool;

(async () => {
    try {
        pool = mysql.createPool({
        host: process.env.DB_HOST, 
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME, 
        waitForConnections: true,
        connectionLimit: 15,
        queueLimit: 0,
        ssl: {
            ca: decodedCert
        }
        });

        // Verifica la conexión
        const [results] = await pool.query('SELECT 1');
        console.log('Connected to MySQL:', results);
    } catch (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
})();

// Simple route for testing
app.get('/', (req, res) => {
    res.send('Hello from the server!');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received. Preparing for graceful shutdown...');

    // Stop the server from accepting new requests.
    server.close(async () => {
        console.log('HTTP server closed.');

        // Close any other resources, e.g., the database connection.
        if (pool && pool.end) {
            try {
                await pool.end();
                console.log('Database connection closed.');
            } catch (error) {
                console.error('Error closing the database', error.stack);
            }
        }

        process.exit(0);
    });
});

// Obtener todas las obras
app.get('/obras', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM obras');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Insertar una nueva obra
app.post('/obras', async (req, res) => {
    const { nombre } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO obras (nombre) VALUES (?)', [nombre]);
        
        // Crear un contenedor para la obra en Azure Blob Storage
        const obraID = result.insertId;
        const containerClient = blobServiceClient.getContainerClient(`obra${obraID}`);
        await containerClient.create();
        
        res.json({ id: obraID });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Borrar una obra
app.delete('/obras/:id', async (req, res) => {
    const idObra = req.params.id;
    try {
        await pool.query('DELETE FROM obras WHERE idObra = ?', [idObra]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
//Proveedores por obra
app.get('/obras/:idObra/proveedores', async (req, res) => {
    const idObra = req.params.idObra;
    try {
        const query = `
            SELECT proveedores.idProveedor, proveedores.proveedor, proveedores_obras.obra_id as obraId 
            FROM proveedores 
            JOIN proveedores_obras ON proveedores.idProveedor = proveedores_obras.proveedor_id 
            WHERE proveedores_obras.obra_id = ?;
        `;

        const [results] = await pool.query(query, [idObra]);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los proveedores
app.get('/proveedores', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM proveedores');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Insertar un nuevo proveedor
app.post('/proveedores', async (req, res) => {
    const { proveedor } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO proveedores (proveedor) VALUES (?)', [proveedor]);
        res.json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Borrar un proveedor
app.delete('/proveedores/:id', async (req, res) => {
    const idProveedor = req.params.id;
    try {
        await pool.query('DELETE FROM proveedores WHERE idProveedor = ?', [idProveedor]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todas las imágenes
app.get('/imagenes', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM imagenes');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Insertar una nueva imagen
app.post('/imagenes', async (req, res) => {
    const { url, proveedorId, obraId } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO imagenes (url, proveedorId, obraId) VALUES (?, ?, ?)', [url, proveedorId, obraId]);
        res.json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Borrar una imagen
app.delete('/imagenes/:id', async (req, res) => {
    const imagenId = req.params.id;
    try {
        await pool.query('DELETE FROM imagenes WHERE imagenId = ?', [imagenId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los registros de proveedores_obras
app.get('/proveedores_obras', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM proveedores_obras');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Insertar un nuevo registro en proveedores_obras
app.post('/proveedores_obras', async (req, res) => {
    const { proveedor_id, obra_id } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO proveedores_obras (proveedor_id, obra_id) VALUES (?, ?)', [proveedor_id, obra_id]);
        res.json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Borrar un registro de proveedores_obras
app.delete('/proveedores_obras/:id', async (req, res) => {
    const proveedor_obra_id = req.params.id;
    try {
        await pool.query('DELETE FROM proveedores_obras WHERE proveedor_obra_id = ?', [proveedor_obra_id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener todos los usuarios
app.get('/usuarios', async (req, res) => {
    try {
        const [results] = await pool.query('SELECT * FROM usuarios');
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Insertar un nuevo usuario
app.post('/usuarios', async (req, res) => {
    const { nombre, apellido, usuario, contrasena, mail } = req.body;
    try {
        const [result] = await pool.query('INSERT INTO usuarios (nombre, apellido, usuario, contrasena, mail) VALUES (?, ?, ?, ?, ?)', [nombre, apellido, usuario, contrasena, mail]);
        res.json({ id: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Borrar un usuario
app.delete('/usuarios/:id', async (req, res) => {
    const idUsuario = req.params.id;
    try {
        await pool.query('DELETE FROM usuarios WHERE idUsuario = ?', [idUsuario]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Subida de imágenes y almacenamiento en la base de datos
app.post('/uploadImage/:obraID/:proveedorID', upload.single('image'), async (req, res) => {
    try {
        const obraID = req.params.obraID;
        const proveedorID = req.params.proveedorID;

        const uniqueImageID = Date.now();
        
        // Simulando subcarpeta para el proveedor con el esquema `obraID/proveedorID_nombreimagen.jpg`
        const blobName = `${obraID}/${proveedorID}_${uniqueImageID}.jpg`;

        const containerClient = blobServiceClient.getContainerClient(`obra${obraID}`);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        await blockBlobClient.uploadData(req.file.buffer);

        const blobUrl = blockBlobClient.url;

        const [result] = await pool.query("INSERT INTO imagenes (url, proveedorId, obraId) VALUES (?, ?, ?)", [blobUrl, proveedorID, obraID]);

        if (result.affectedRows > 0) {
            res.send("Imagen subida y URL almacenada correctamente");
        } else {
            res.status(500).send("Error al almacenar la URL en la base de datos");
        }
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});

    

app.get('/getImages/:obraID/:proveedorID', async (req, res) => {
    try {
        const obraID = req.params.obraID;
        const proveedorID = req.params.proveedorID;

        // Consulta a tu base de datos para obtener las URL de las imágenes asociadas con esta obra y proveedor
        const [images] = await pool.query("SELECT url FROM imagenes WHERE obraId = ? AND proveedorId = ?", [obraID, proveedorID]);

        res.json(images);
    } catch (error) {
        res.status(500).send(`Error: ${error.message}`);
    }
});




