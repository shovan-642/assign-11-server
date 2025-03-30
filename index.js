const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config();

const app = express()
const port = process.env.PORT || 3000;


app.use(cors({
  origin: ["http://localhost:5173"],
  credentials: true,
}))

app.use(express.json())
app.use(cookieParser())

const verifyToken = (req, res, next)=>{
  const token = req.cookies?.token
  console.log( token)
  if(!token){
    return res.status(401).send({message: 'Unauthorized Token'})
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: 'Unauthorized Token'})
    }
    req.user = decoded
    next()
  })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@assignment-10.9gvo9.mongodb.net/?appName=assignment-10`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      // Send a ping to confirm a successful connection

      console.log("Pinged your deployment. You successfully connected to MongoDB!");

      const tutorialCollection = client.db('language-tutor').collection('tutor');
      const bookTutorCollection = client.db('language-tutor').collection('book-tutor');

      app.post("/", async(req, res)=>{
        const newTutorial = req.body
        const result = await tutorialCollection.insertOne(newTutorial)
        res.send(result)
      })

      app.post("/bookTutor", async(req, res)=>{
        const bookTutor = req.body
        const result = await bookTutorCollection.insertOne(bookTutor)
        res.send(result)
      })

      app.post("/jwt", async(req, res)=>{
        const user = req.body 
        const token = jwt.sign(user, process.env.JWT_SECRET, {expiresIn: "5h"} )
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV || "production",
          sameSite: "None"
        }).send({success: true})
      })

      app.post("/logout", (req, res)=>{
        res.clearCookie('token', {
          httpOnly: true, 
          secure: false,

        })
        .send({success: true})
      })




      app.get("/tutor", async(req, res)=>{
        const {search} = req.query
        let option = {}
        if(search){
          option={language: {$regex: search, $options:"i"}}
        }
        const cursor = tutorialCollection.find(option)
        const result =  await cursor.toArray()
        res.send(result)
      })

      app.get("/bookTutor", async(req, res)=>{
        const cursor = bookTutorCollection.find()
        const result =  await cursor.toArray()
        res.send(result)
      })

      app.patch("/review/:id", async(req,res)=>{
        const id = req.params.id
        const filter = {_id : new ObjectId(id)}
        const updateReview = {
          $inc : {review: 1}
        }
        const result = await tutorialCollection.updateOne(filter, updateReview)
        res.send(result)
      })

      app.put('/tutor/:id', async(req, res)=>{
        const id = req.params.id
        const filter = {_id: new ObjectId(id)}
        const options =  {upsert: true}
        const updateTutorial = req.body
        const updatedTutorial ={
          $set:{
             name : updateTutorial.name, 
             tutor_email : updateTutorial.tutor_email,
             image : updateTutorial.image,
             language : updateTutorial.language,
             price : updateTutorial.price,
             description : updateTutorial.description, 
             review : updateTutorial.review,
             TutorImage : updateTutorial.TutorImage,
            },
            
        }
        const result = await tutorialCollection.updateOne(filter, updatedTutorial, options)
        res.send(result) 
      })

      app.delete("/tutor/:id", async(req, res)=>{
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const result = await tutorialCollection.deleteOne(query)
        res.send(result)
      })

      app.get("/tutor/:id", async(req,res)=>{
        const id =  req.params.id
        console.log(id)
        const query = {_id: new ObjectId(id)}
        const result = await tutorialCollection.findOne(query)
        res.send(result)
      })

      app.get("/bookTutor/:id", async(req,res)=>{
        const id =  req.params.id
        const query = {tutorId: new ObjectId(id)}
        const result = await bookTutorCollection.findOne(query)
        res.send(result)
      })

      app.get("/myTutorials", verifyToken, async(req,res)=>{
        const email =  req.query?.email
        const query = {tutor_email: email}

        if(req.user.email !== req.query.email){
          return res.status(403).send({message: "Forbidden Access"})          
        }        

        const result = await tutorialCollection.find(query).toArray()
        res.send(result)
      })

      app.get("/myBookTutor", verifyToken, async(req,res)=>{
        const email =  req.query?.email
        const query = {userEmail: email}
        
        if(req.user.email !== req.query.email){
          return res.status(403).send({message: "Forbidden Access"})          
        }

        const result = await bookTutorCollection.find(query).toArray()
        res.send(result)
      })

      app.get("/find-tutors/:category", async(req,res)=>{
        const category = req.params.category
        const query = {language: category}
        const tutors = await tutorialCollection.find(query).toArray()
        res.send(tutors)
      })


    } finally {
      // Ensures that the client will close when you finish/error
    }
  }
  run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('server is running good')
})

app.listen(port, ()=>{
    console.log(`port is running ${port}`)
})