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
        let current_row = document.createElement("div");
        let current_html = `<div class="row" data-full="${btoa(JSON.stringify(row))}"><h3>${row["Store Name"]}</h3> 
<div class="rowdata">
<p class="priceelement">Bananas: ${row["Banana Price (lb)"]} per pound</p>
<p class="priceelement">Straberries: ${row["Strawberry Price (oz)"]} per ounce</p>
<p class="priceelement">Apples: ${row["Apple Price (oz)"]} per ounce</p>
<p class="priceelement">Potatoes: ${row["Potato Price (lb)"]} per pound</p>
<p class="priceelement">Onions: ${row["Onion Price (lb)"]} per pound</p>
<p class="priceelement">Tomatoes: ${row["Tomato Price (lb)"]} per pound</p>
</div></div>`
        current_row.innerHTML=current_html
        tableElement.appendChild(current_row)
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