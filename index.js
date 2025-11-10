const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Koneksi database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'feraistanti0227',
    database: 'cihuy',
    port: 3308
});

db.connect(err => {
    if (err) throw err;
    console.log("✅ Terhubung ke MySQL");
});

// ✅ Halaman utama
app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Generate API key + auto save ke database
app.post('/create', (req, res) => {
    const key = crypto.randomBytes(16).toString('hex');

    db.query("INSERT INTO cihuy (apikey) VALUES (?)", [key], (err) => {
        if (err) {
            console.error(err);
            return res.json({ message: "Gagal menyimpan ke database", apikey: null });
        }

        res.json({
            apikey: key,
            message: "API Key berhasil dibuat & disimpan!"
        });
    });
});

// ✅ VALIDASI API KEY DARI BODY (POSTMAN)
app.post('/validate', (req, res) => {
    if (!req.body || !req.body.key) {
        return res.status(400).json({
            valid: false,
            message: "Body harus berisi JSON: { key: \"API_KEY\" }"
        });
    }

    const key = req.body.key;

    db.query("SELECT * FROM cihuy WHERE apikey = ?", [key], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                valid: false,
                message: "Terjadi kesalahan pada server"
            });
        }

        if (result.length > 0) {
            return res.json({
                valid: true,
                message: "API Key valid ✅"
            });
        } else {
            return res.json({
                valid: false,
                message: "API Key tidak valid ❌"
            });
        }
    });
});



// ✅ ENDPOINT PROTECTED UNTUK TEST POSTMAN
app.get('/protected', validateApiKey, (req, res) => {
    res.json({ message: "✅ API Key valid. Akses berhasil!" });
});

// ✅ Start server
app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});