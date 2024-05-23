const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

router.get("/invoices", async (req, res, next) => {
    try {
        const result = await db.query(`SELECT id, comp_code FROM invoices`);
        return res.json({ invoices: result.rows })
    } catch (err) {
        return next(err);
    }
})

router.get("/invoices/:id", async (req, res, next) => {
    try {
        let id = req.params.id;
        const result = await db.query(
            `SELECT i.id, i.comp_code, i.amt, i.paid, i.add_date, i.paid_date, c.name, c.description
            FROM invoices AS i INNER JOIN companies AS c ON i.comp_code = c.code
            WHERE id = $1`, [id]);
        if (result.rows.length === 0) {
            let notFoundError = new Error(`There is no company with this code '${id}'`);
            notFoundError.status = 404;
            throw notFoundError;
        }   
        const data = result.rows[0];
        const invoice = {
            id: data.id,
            company: {
                code: data.comp_code,
                name: data.name,
                description: data.description,
            },
            amt: data.amt,
            paid: data.paid,
            add_date: data.add_date,
            paid_date: data.paid_date,
        };
        return res.json({ "invoice": invoice })
    } catch(err) {
        return next(err);
    }
})

router.get("companies/:code", async (req, res, next) => {
    try {
       let code = req.params.code;
       const result = await db.query(
        `SELECT c.code, c.name, c.description, i.comp_code, i.amt, i.paid, i.add_date, i.paid_date
        FROM companies AS c INNER JOIN invoices AS i ON c.code = i.comp_code
        WHERE code = $1`, [code]); 
        if (result.rows.length === 0) {
            let notFoundError = new Error(`There is no company with this code '${code}'`);
            notFoundError.status = 404;
            throw notFoundError;
        }   
        const data = result.rows[0];
        const company = {
            code: data.code,
            invoice: {
                comp_code: data.code,
                amt: data.amt,
                paid: data.paid,
                add_date: data.add_date,
                paid_date: data.paid_date,
            },
            name: data.name,
            description: data.description,
        };
        return res.json({ "company": company })
    } catch (err) {
        return next(err);
    }
})

router.post("/invoices", async (req, res, next) => {
    try {
        const { comp_code, amt } = req.body;
        const result = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code,
        amt, paid, add_date, paid_date`, [comp_code, amt]);
        return res.status(201).json({ invoice: result.rows[0] })
    }
    catch (err) {
        return next(err)
    }
})

router.put("/invoices:id", async (req, res, next) => {
    try {
        const id = req.params.id;
        const {amt, paid, paid_date} = req.body;
        const result = await db.query(`UPDATE invoices SET amt = $1, paid = $2, paid_date = $3
        WHERE id = $4 RETURNING id, comp_code, amt, paid, add_date, paid_date`, [amt, paid, paid_date, id]);
        if (result.rows.length === 0) {
            throw new ExpressError(`Invoice not found: id ${id}`, 404)
        }
        return res.send({ invoice: result.rows[0] })
    } catch (err) {
        return next(err)
    }
})

router.delete("/invoices/:id", async (req, res, next) => {
    try {
        const result = db.query(`DELETE FROM invoices WHERE id = $1`, [req.params.id])
        return res.send({ msg: "DELETED" })
    } catch (err) {
        return next(err)
    }
})

module.exports = router;