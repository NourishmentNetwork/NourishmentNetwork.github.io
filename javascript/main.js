// get data from url
async function getData(url){
    const curRequest = new Request(url);
    return fetch(curRequest)
        .then((response)=>response.text())
        .then((text) => {
            return text
        });
}

// load the table into a variable
const tableElement = document.getElementById("table");

// load and return the csv as a json object
async function get_csv(){
    return await getData("/prices.csv").then((csv) => {return Papa.parse(csv,{"header":true})["data"]});
}

var prices_json;

async function load_table(){
    // load the json into the global variable
    prices_json = await get_csv();

    // add each row
    prices_json.forEach(row => {
        // let current_row = document.createElement("div");
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
        tableElement.innerHTML+=current_html
    });

    // synchronize scrolling for each div
    const divs = document.querySelectorAll('.rowdata');
    divs.forEach(div => div.addEventListener( 'scroll', e => {
        divs.forEach(d => { // when a div is scrolled update the rest to match
            d.scrollLeft = div.scrollLeft;
        });
    }) );
}

load_table();

function filter_rows(){

    const price_text_boxes = document.querySelectorAll(".pricetextbox");

    let store_name = document.getElementById("storenamesearch").value.toLowerCase();
    // console.log(store_name);

    // take every text box and load it into a list
    let prices = [];
    price_text_boxes.forEach(text_box =>{
        if (text_box.value != ""){
            let result = parseFloat(text_box.value);
            if (isNaN(result)){
                alert("One or more texboxes are invalid!");
                prices.push(1000.0)
            } else {prices.push(result);}
        } else {prices.push(1000.0)} // no price should ever be over 1000, so it is used as a placeholder
    })


    console.log(prices);
    
    // get all rows except the searchbar row
    const divs = document.querySelectorAll('.row:not(.search)');
    divs.forEach(row => {
        // get the data of the current row
        let row_data = JSON.parse(atob(row.dataset.full));
        
        // filter out the costs
        let invalid = (parseFloat(row_data["Banana Price (lb)"]) > prices[0]) || 
                        (parseFloat(row_data["Strawberry Price (oz)"]) > prices[1]) ||
                        (parseFloat(row_data["Apple Price (oz)"]) > prices[2]) ||
                        (parseFloat(row_data["Potato Price (lb)"]) > prices[3]) ||
                        (parseFloat(row_data["Onion Price (lb)"]) > prices[4]) ||
                        (parseFloat(row_data["Tomato Price (lb)"]) > prices[5]) ||
                        !(row_data["Store Name"].toLowerCase().includes(store_name));

        if (invalid){
            row.classList.add("hidden");
        } else {
            row.classList.remove("hidden");
        }
    })
}