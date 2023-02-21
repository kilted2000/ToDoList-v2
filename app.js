//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-richard:test123@cluster0.wfazukh.mongodb.net/todolistDB", {useNewUrlParser: true});

mongoose.set('strictQuery', false);

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const defaultOne = new Item({name: "Welcome to your todolist!"});

const defaultTwo = new Item({name: "Hit the + button to add a new item."});

const defaultThree = new Item({name: "<-- Hit this to delete an item."});

const defaultItems = [defaultOne, defaultTwo, defaultThree];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

const day = date.getDate();

app.get("/", function(req, res) {

Item.find({}, function(err, foundItems){
  if(foundItems.length === 0){
    Item.insertMany(defaultItems, function(err){
      if(err){
        console.log(err)
      }else{
        console.log("Added default items to DB")
      }
    });
    res.redirect("/");
  }else{
    res.render("list", {listTitle: "Today",dateToday: day,newListItems: foundItems});
  }
});



});

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err,foundList){
    if(!err){
     if(!foundList){
      const list = new List({name: customListName, items: defaultItems})
      list.save();
      res.redirect("/" + customListName);
     }else{
       res.render("list", {listTitle: foundList.name,dateToday: day, newListItems: foundList.items});
     }
    }
 });


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;

  const listName = req.body.list;

  const item = new Item({name: itemName});

if(listName === "Today"){
  item.save();
  res.redirect("/");
}else{
  List.findOne({name: listName}, function(err, foundList){
    foundList.items.push(item);
    foundList.save();
     res.redirect("/" + listName);

  })
  
}

  

});

app.post("/delete", function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName= req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, function(err){
      if(!err){
        console.log("Success!");
        res.redirect("/");
      }
    });
    }else{
      List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}},function(err, foundList){
        if(!err){
          res.redirect("/" + listName);
     
    }
  });
  }

});

app.get("/about", function(req, res){
  res.render("about");
});

const PORT = process.env.PORT || 3000

const connectDB = async () => {
  try {
    const conn = mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

//Routes go here
app.all('*', (req,res) => {
  res.json({"every thing":"is awesome"})
});

//Connect to the database before listening
connectDB().then(() => {
  app.listen(PORT, () => {
      console.log("listening for requests");
  })
});