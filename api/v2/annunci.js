const express = require('express');
const router = express.Router();
const Annuncio = require('../../models/Annuncio'); // ci serve per interagire con il db
const Utente = require('../../models/Utente');
const controllo_token = require('../../controllo_token');
const jwt = require("jsonwebtoken");

//restituisce annunci in base al filtro
router.get('', async (req, res) => {
    // query

    var query = {
        attrezzatura_necessaria: req.headers['attrezzatura_necessaria'],
        costo: {
            $lte: req.headers['costo']
        },
        sport: req.headers['sport'],
        citta: req.headers['citta']
    };

    try {
        const annunci = await Annuncio.find(query);
        if (annunci.length == 0) {
            res.status(404).json({
                message: "niente annunci disponibili con quei parametri"
            });
            return;
        }
        res.status(201).json(annunci);
    } catch (err) {
        res.status(404).json({
            message: err
        });
    }
});

// Aggiunge un nuovo annuncio
router.post('', (req, res) => {

    var token = req.body.token || req.query.token || req.headers["x-access-token"];

    if (!token) {
        res.status(401).json({
            message: "niente token"
        });
        return;
    }

    jwt.verify(token, process.env.SEGRETO, (err, decoded) => {
        if (err) {
            res.status(403).json({
                message: "token non valido"
            });
            return;
        } else
            req.loggedUser = decoded;
    });

    var annuncio = new Annuncio({
        autore: req.body.autore,
        sport: req.body.sport,
        min_partecipanti: req.body.min_partecipanti,
        max_partecipanti: req.body.max_partecipanti,
        attrezzatura_necessaria: req.body.attrezzatura_necessaria,
        costo: req.body.costo,
        citta: req.body.citta,
        sport: req.body.sport
    });


    if (annuncio.min_partecipanti == null)
        annuncio.min_partecipanti = 2;

    if (annuncio.min_partecipanti > annuncio.max_partecipanti) {
        console.error("annuncio invalido!");
        console.error(annuncio);
        res.status(400).json({
            message: "annuncio invalido! max partecipanti e' minore di min partecipanti"
        });
        return;
    }

    annuncio.save(async (err, doc) => {
        if (!err) {
            let annuncio_id = annuncio._id;

            // specificare l'utente
            query = {
                "_id": req.body.autore
            };

            // specificare l'annuncio
            updateDocument = {
                $push: {
                    "annunci_pubblicati": annuncio_id
                }
            };

            // aggiungere l'annuncio alla lista di annunci di cui l'utente e' l'autore
            result = await Utente.updateOne(query, updateDocument);

            res.status(202).json(annuncio._id);
            return;
        } else
            res.status(400).json(err);
        return;
    });
});

// Iscrizione ad annuncio
router.post("/:annuncioId", async (req, res) => {
    try {
        const utente = await Utente.findById(req.body.id_utente);
        const annuncio = await Annuncio.findById(req.params.annuncioId);

        if (utente.iscrizione_annunci.filter(e => e === annuncio.id).length > 0) {
            res.status(400).json({
                "message": "sei gia' iscritto a questo annuncio"
            });
            return;
        }

        if (annuncio.partecipanti.filter(e => e === utente.id).length > 0) {
            res.status(400).json({
                "message": "sei gia' iscritto a questo annuncio"
            });
            return;
        }

        if (annuncio.partecipanti.length >= annuncio.max_partecipanti) {
            res.status(400).json({
                "message": "questo annuncio e' gia' pieno! impossibile iscriversi"
            });
            return;
        }

        // specificare l'annuncio
        let query = {
            "_id": req.params.annuncioId
        };

        // specificare l'utente
        let updateDocument = {
            $push: {
                "partecipanti": req.body.id_utente
            }
        };

        // aggiungere l'utente ai partecipanti dell'annuncio
        let result = await Annuncio.updateOne(query, updateDocument);


        // specificare l'utente
        query = {
            "_id": req.body.id_utente
        };

        // specificare l'annuncio
        updateDocument = {
            $push: {
                "iscrizione_annunci": req.params.annuncioId
            }
        };

        // aggiungere l'annuncio alla lista di annunci a cui l'utente e' iscritto
        result = await Utente.updateOne(query, updateDocument);

        res.status(211).json({
            "message": "success"
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            message: err
        });
    }
});

// Disiscrizione da annuncio
router.delete("/:annuncioId", async (req, res) => {
    try {
        const utente = await Utente.findById(req.body.id_utente);
        const annuncio = await Annuncio.findById(req.params.annuncioId);

        if (utente.iscrizione_annunci.filter(e => e === annuncio.id).length === 0) {
            res.status(400).json({
                "message": "non sei iscritto a questo annuncio"
            });
            return;
        }

        if (annuncio.partecipanti.filter(e => e === utente.id).length === 0) {
            res.status(400).json({
                "message": "non sei iscritto a questo annuncio"
            });
            return;
        }

        // specificare l'annuncio
        let query = {
            "_id": req.params.annuncioId
        };

        // specificare l'utente
        let updateDocument = {
            $pull: {
                "partecipanti": req.body.id_utente
            }
        };

        // togliere l'utente dai partecipanti dell'annuncio
        let result = await Annuncio.updateOne(query, updateDocument);


        // specificare l'utente
        query = {
            "_id": req.body.id_utente
        };

        // specificare l'annuncio
        updateDocument = {
            $pull: {
                "iscrizione_annunci": req.params.annuncioId
            }
        };

        // togliere l'annuncio dalla lista di annunci a cui l'utente e' iscritto
        result = await Utente.updateOne(query, updateDocument);

        res.status(221).json({
            "message": "success"
        });
    } catch (err) {
        res.status(500).json({
            message: err
        });
    }
});


// Restituisce uno specifico annuncio
router.get('/:annuncioId', async (req, res) => {
    try {
        const annuncio = await Annuncio.findById(req.params.annuncioId);
        res.status(210).json(annuncio);
    } catch (err) {
        res.json({
            message: err
        });
    }
});

module.exports = router;