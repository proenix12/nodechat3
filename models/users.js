let mongoose = require('mongoose');

let userSchema = mongoose.Schema({
    userName:{
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

let Users = module.exports = mongoose.model('Users', userSchema);