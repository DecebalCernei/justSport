const express = require('express');
const router = express.Router();
const Annuncio = require('../../models/Annuncio'); // ci serve per interagire con il db
const Utente = require('../../models/Utente');

// Get all posts
router.get('/', async (req, res) => {
    try {
        const annunci = await Annuncio.find();
        res.json(annunci);
    } catch (err) {
        res.json({
            message: err
        });
    }
});

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

        // iscrizione

        res.render("annuncio", {
            data: annuncio.toJSON()
        });
    } catch (err) {
        res.json({
            message: err
        });
    }
});

router.get("/add", (req, res) => {
    res.render("../views/add-annuncio");
});

router.post("/", (req, res) => { // url come risorse
    var annuncio = new Annuncio({
        min_partecipanti: req.body.min_partecipanti,
        max_partecipanti: req.body.max_partecipanti,
        attrezzatura_necessaria: req.body.attrezzatura_necessaria,
        costo: req.body.costo,
        citta: req.body.citta,
    });

    if (annuncio.min_partecipanti == null)
        annuncio.min_partecipanti = 2;

    if (annuncio.min_partecipanti > annuncio.max_partecipanti)
        throw "annuncio invalido! max partecipanti e' maggiore di min partecipanti";

    annuncio.save((err, doc) => {
        if (!err)
            res.redirect("/annunci");
        else
            res.send(err);
    })
});

// Get a specific post
router.get('/:annuncioId', async (req, res) => {
    try {
        const annuncio = await Annuncio.findById(req.params.annuncioId);
        res.render("annuncio", {
            data: annuncio.toJSON()
        });
    } catch (err) {
        res.json({
            message: err
        });
    }
});

module.exports = router;