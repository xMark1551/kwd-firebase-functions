"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.post = void 0;
const post = async (req, res) => {
    console.log("BODY:", req.body);
    // Your service logic here
    res.status(200).json({
        ok: true,
        message: "Admin post created",
    });
};
exports.post = post;
