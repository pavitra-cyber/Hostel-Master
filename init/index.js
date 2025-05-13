const mongoose = require("mongoose");
const initData = require("./data.js");
const Issues = require("../model/schema.js");

main()
.then((res)=>{
    console.log("Connecte to database 'Hostel'..");
})
.catch((err)=>{
    console.log(err);
})

async function main(){
    mongoose.connect("mongodb://127.0.0.1:27017/Hostel");
}

const  initDB = async()=> {
    await Issues.deleteMany({});
    await Issues.insertMany(initData.data);
    console.log("Data get initilized");
} 

initDB();