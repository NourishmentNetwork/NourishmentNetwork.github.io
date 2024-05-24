// get data from url
async function getData(url){
    // creates a fetch request and then returns just the response
    const curRequest = new Request(url);
    return fetch(curRequest)
        .then((response)=>response.text()) // get only the text
        .then((text) => {
            return text // return it
        });
}

// load the table into a variable
const tableElement = document.getElementById("table");

// load and return the csv as a json object
async function get_csv(){
    // first use the get data function to open the csv file and get it as a string
    return await getData("/prices.csv")
        .then((csv) => { // then use papaparse to change it to a json object
            return Papa.parse(csv,{"header":true})["data"] 
            // also only return the data, and not the other things papaparse returns
            // e.g. errors
        });
}

var prices_json; // create global variable

// create empty global variable
var store_names = [];

async function load_table(){
    // load the json into the global variable
    prices_json = await get_csv();

    // loop over json then add each row
    prices_json.forEach(row => {
        // use an html template, and fill in the costs and other data
        let current_html = `<div class="row" data-full="${btoa(JSON.stringify(row))}"><h3>${row["Store Name"]}</h3> 
<div class="rowdata">
<p class="priceelement">Bananas: $${row["Banana Price (lb)"]} per pound</p>
<p class="priceelement">Straberries: $${row["Strawberry Price (oz)"]} per ounce</p>
<p class="priceelement">Apples: $${row["Apple Price (oz)"]} per ounce</p>
<p class="priceelement">Potatoes: $${row["Potato Price (lb)"]} per pound</p>
<p class="priceelement">Onions: $${row["Onion Price (lb)"]} per pound</p>
<p class="priceelement">Tomatoes: $${row["Tomato Price (lb)"]} per pound</p>
</div></div>`
        // current_row.innerHTML=current_html
        tableElement.innerHTML+=current_html; // append the element to the table
        store_names.push(row["Store Name"]);
    });

    // synchronize scrolling for each div
    const divs = document.querySelectorAll('.rowdata');
    divs.forEach(div => div.addEventListener( 'scroll', e => {
        divs.forEach(d => { // when a div is scrolled update the rest to match
            d.scrollLeft = div.scrollLeft;
        });
    }) );

    await start_autocomplete();

}

load_table(); // run the function

// function that hides and shows rows based on what the user inputs
function filter_rows(){

    // load in the text box objects
    const price_text_boxes = document.querySelectorAll(".pricetextbox");

    // get the store name the user inputted 
    let store_name = document.getElementById("storenamesearch").value.toLowerCase();
    // changed to lowercase so it can match better

    // take every text box and load it into a list
    let prices = [];
    price_text_boxes.forEach(text_box =>{
        if (text_box.value != ""){ // skip over empty boxes
            let result = parseFloat(text_box.value); // attempt to convert into a float
            if (isNaN(result)){ // if the box has invalid inputs
                text_box.value = ""; // clear it
                prices.push(1000.0) // no price should ever be over 1000, so it is used as a placeholder
            } else {prices.push(result);}
        } else {prices.push(1000.0)} // same as other 1000
    })


    console.log(prices); // log the prices for debug
    
    // get all rows except the searchbar row
    const divs = document.querySelectorAll('.row:not(.search)');
    divs.forEach(row => {
        // get the data of the current row
        let row_data = JSON.parse(atob(row.dataset.full));
        
        // filter out the costs
        let invalid = (parseFloat(row_data["Banana Price (lb)"]) > prices[0]) ||  // check each price against what the user entered
                        (parseFloat(row_data["Strawberry Price (oz)"]) > prices[1]) ||
                        (parseFloat(row_data["Apple Price (oz)"]) > prices[2]) ||
                        (parseFloat(row_data["Potato Price (lb)"]) > prices[3]) ||
                        (parseFloat(row_data["Onion Price (lb)"]) > prices[4]) ||
                        (parseFloat(row_data["Tomato Price (lb)"]) > prices[5]) ||
                        !(row_data["Store Name"].toLowerCase().includes(store_name)); // if the store's name contains what the user entered

        // hide any rows that don't match the search
        if (invalid){
            row.classList.add("hidden");
        } else {
            // unhide rows that do match
            row.classList.remove("hidden");
        }
    })
}

async function start_autocomplete(){
    var inp = document.getElementById("storenamesearch");

    var autocomplete_container = document.getElementById("autocomplete_menu");

    inp.addEventListener("input", (e)=>{
        autocomplete_container.innerHTML="";
        
        var val = inp.value;
        store_names.forEach(name => {
            // console.log(name.toLowerCase());
            if (name.toLowerCase().startsWith(val.toLowerCase())){
                console.log(name);
                let item = document.createElement("div");
                item.classList.add("autocomplete_item");
                item.innerHTML=`<p>${name}</p>`
                item.addEventListener("click", e => {
                    inp.value=name;
                    autocomplete_container.innerHTML="";
                });
                autocomplete_container.appendChild(item);
            }
        })

        filter_rows();
    });

    document.addEventListener("click", function (e) {
        autocomplete_container.innerHTML="";
    });
}