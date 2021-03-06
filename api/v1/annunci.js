const express = require('express');
const router = express.Router();
const Annuncio = require('../../models/Annuncio'); // ci serve per interagire con il db
const Utente = require('../../models/Utente');
/*
// Restituisce tutti gli annunci
router.get('', async (req, res) => {
    try {
        const annunci = await Annuncio.find();
        res.status(201).json(annunci);
    } catch (err) {
        res.json({
            message: err
        });
    }
});
*/


// Aggiunge un nuovo annuncio
router.post('', (req, res) => {
    console.log(req.body);
    var annuncio = new Annuncio({
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

    if (annuncio.min_partecipanti > annuncio.max_partecipanti)
        throw "annuncio invalido! max partecipanti e' maggiore di min partecipanti";

    annuncio.save((err, doc) => {
        if (!err)
            res.status(202).json(annuncio._id);
        else
            res.send(err);
    });
});

// Iscrizione ad annuncio
router.post("/:annuncioId", async (req, res) => {
    try {
        const utente = await Utente.findById(req.body.id_utente);
        const annuncio = await Annuncio.findById(req.params.annuncioId);

        if (utente.iscrizione_annunci.filter(e => e === annuncio.id).length > 0)
            throw "sei gia' iscritto a questo annuncio";

        if (annuncio.partecipanti.filter(e => e === utente.id).length > 0)
            throw "sei gia' iscritto a questo annuncio";

        if (annuncio.partecipanti.length >= annuncio.max_partecipanti)
            throw "questo annuncio e' gia' pieno! impossibile iscriversi";

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

        console.log(result);

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

        res.status(210).json("success");
    } catch (err) {
        res.json({
            message: err
        });
    }
});


// Restituisce uno specifico annuncio
router.get('/:annuncioId', async (req, res) => {
    try {
        const annuncio = await Annuncio.findById(req.params.annuncioId);
        res.status(203).json(annuncio);
    } catch (err) {
        res.json({
            message: err
        });
    }
});
module.exports = router;