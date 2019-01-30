const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');
const fetch = require('node-fetch');


const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'francois',
    password : 'francois',
    database : 'weatherdb'
  }
});


const app = express();

app.use(cors());
app.use(bodyParser.json()) 


const id = '9b366bf0b44509fd4b0e04b212ec1a08'


app.get('/', (req, res)=>{
	res.json('server');
})


app.post('/getapi', (req,res)=>{
	fetch('https://api.openweathermap.org/data/2.5/weather?q=' + req.body.city + '&APPID='+ id +'&units=metric')
    .then(res => res.json())
    .then(data => res.json(data))
})


app.post('/signin', (req,res)=>{
	const {email, password} = req.body;
	// compare bcrypt password
	
	db.select('*').from('login').where('email', '=', email)
	.then(data=>{
		const isValid = bcrypt.compareSync(password, data[0].hash);
		if(isValid){
			db.select('*').from('users').where('email', '=', email)
			.then(user=> res.json(user[0]))
		}else{
			res.status(400).json('err')
		}
	})
	.catch(err=> res.status(400).json('err'))
	



})

// put inside users and login table by transaction and bcrypt

app.post('/register', (req, res)=>{
	const {email, password, city, name} = req.body;
	const hash = bcrypt.hashSync(password)
	if(!email || !password || !city || !name){
		return res.status(400).json('empty')
		}
	db.transaction(trx=>{
			trx.insert({
				hash,
				email
			})
			.into('login')
			.returning('email')
			.then(loginEmail=>{
				return trx.insert({
					email: loginEmail[0],
					city,
					name
				})
				.into('users')
				.returning('*')
				.then(user=> res.json(user[0]))
			})
			.then(trx.commit)
	    	.catch(trx.rollback);
		})
})


app.post('/profile', (req,res)=>{
	db.select('*').from('users').where('email', '=', req.body.email)
	.then(user=> res.json(user[0]))
})


app.put('/profile', (req,res)=>{
	db('users').where('email', '=', req.body.email)
	.update({name:req.body.name, city:req.body.city})
	.returning('*')
	.then(user=>res.json(user[0]))
})


app.listen(3001, ()=>{
	console.log('server start on localhost:3001')
})



// const url = "https://jsonplaceholder.typicode.com/users";
// 	fetch(url, (error, response, body) => {
//   	let json = JSON.parse(body);
//   	console.log(body);
// });