const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");

router.get("/companies", async (req, res, next) => {
    try {
        const result = await db.query(`SELECT code, name FROM companies`);
        return res.json({ companies: result.rows })
    }
    catch (err) {
        return next(err);
    }
})

router.get("/companies/:code", async (req, res, next) => {
    try {
        const companyQuery = await db.query(
            "SELECT code, name, description FROM companies WHERE code = $1", [req.params.code]);
        
        if (companyQuery.rows.length === 0) {
            let notFoundError = new Error(`There is no company with this code '${req.params.code}'`);
            notFoundError.status = 404;
            throw notFoundError;
        }
        return res.json({ company: companyQuery.rows[0] });
    } catch (err) {
        return next(err);
    }
})

router.post("/companies", async (req, res, next) => {
    try {
        const { name, description } = req.body;
        let code = slugify(name, {lower: true});
        const result = await db.query(`INSERT INTO companies (name, description) VALUES ($1, $2) RETURNING code, name, description`, [name, description, code]);
        return res.status(201).json({ company: result.rows[0] })
    } catch (err) {
        return next(err)
    }
})

router.put("/companies/:code", async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, description } = req.body;
        const result = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`, [name, description, code]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Can't update company with code ${code}`, 404)
        }
        return res.send({ company: result.rows[0] })
    } catch(err) {
        return next(err)
    }
})

router.delete("/companies/:code", async (req, res, next) => {
    try {
        const result = db.query(`DELETE FROM companies WHERE code = $1`, [req.params.code])
        return res.send({ msg: "DELETED" })
    } catch (err) {
        return next(err)
    }
})

module.exports = router;