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
<p class="priceelement" data-producetype="fruit" data-produce="banana">Bananas: $${row["Banana Price (lb)"]} per pound</p>
<p class="priceelement" data-producetype="fruit" data-produce="strawberry">Straberries: $${row["Strawberry Price (oz)"]} per ounce</p>
<p class="priceelement" data-producetype="fruit" data-produce="apple">Apples: $${row["Apple Price (oz)"]} per ounce</p>
<p class="priceelement" data-producetype="vegetable" data-produce="potato">Potatoes: $${row["Potato Price (lb)"]} per pound</p>
<p class="priceelement" data-producetype="vegetable" data-produce="onion">Onions: $${row["Onion Price (lb)"]} per pound</p>
<p class="priceelement"data-producetype="vegetable" data-produce="tomato">Tomatoes: $${row["Tomato Price (lb)"]} per pound</p>
</div></div>`; // each row contains data for produce type (vegetable or fruit, and actual produce type)
        tableElement.innerHTML+=current_html; // append the element to the table
        store_names.push(row["Store Name"]);
    });

    // synchronize scrolling for each div
    const divs = document.querySelectorAll('.rowdata');
    const scroll_switch = document.getElementById("slide-sync");
    divs.forEach(div => div.addEventListener( 'scroll', e => {
        if (scroll_switch.checked) {
            divs.forEach(d => { // when a div is scrolled update the rest to match
                d.scrollLeft = div.scrollLeft;
            });
        }
    }) );

    await start_autocomplete();

}

load_table(); // run the function

// 1 is all
// 2 is fruits only
// 3 is vegetables only
var producetype=1;

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
            if (isNaN(result) || text_box.offsetParent === null){ 
                // if the box has invalid inputs
                // or if it is hidden (from the dropdown menu)
                console.log("invalid input");
                text_box.value = ""; // clear it
                prices.push(1000.0); // use placeholder for invalid input
                // no price should ever be over 1000, so it is used as a placeholder
            } else {prices.push(result);}
        } else {prices.push(1000.0)} // use placeholder for empty input
    })


    console.log(prices); // log the prices for debug
    
    // get all rows except the searchbar row
    const divs = document.querySelectorAll('.row:not(.search)');
    divs.forEach(row => {
        // get the data of the current row
        let row_data = JSON.parse(atob(row.dataset.full));
        
        // filter out based on inputs
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
    });

    // create variables for easy filtering
    const produce_selections = Array.from(document.querySelectorAll(".produce_selector input")).map(a=>a.checked); // get all inputs of checkboxes
    const produce_types = ["banana","strawberry","apple","potato","onion","tomato"];
    console.log(produce_selections); // log for debug
    console.log(produce_types);

    // loop over every data item
    document.querySelectorAll(".rowdata .priceelement").forEach((element) => {
        let current_producetype = element.dataset.producetype;
        
        // hide any ones that don't match the producetype
        element.classList.remove("hidden");
        // if fruits only is selected and the produce type is vegetable
        // or if vegetables only and the produce type is fruit
        // or if it is not selected by the user
        if ((producetype === 2 && current_producetype === "vegetable") || (producetype === 3 && current_producetype === "fruit") || !produce_selections[produce_types.indexOf(element.dataset.produce)]){
            element.classList.add("hidden")
        }
    })
}

async function start_autocomplete(){
    var inp = document.getElementById("storenamesearch"); // Load the text input

    // Load the autocomplete container element
    var autocomplete_container = document.getElementById("autocomplete_menu");

    inp.addEventListener("input", (e)=>{
        // clear the container
        autocomplete_container.innerHTML="";
        
        var val = inp.value; // get the inputted value

        store_names.forEach(name => { // loop over every store name
            if (name.toLowerCase().startsWith(val.toLowerCase())){ // if the store name starts with what the user entered
                console.log(name); // log it

                // create a div to store it
                let item = document.createElement("div");
                item.classList.add("autocomplete_item"); // add proper classes
                item.innerHTML=`<p>${name}</p>` // add the text

                // add an event listener
                // when the option is selected
                item.addEventListener("click", e => {
                    inp.value=name; // set value to whatever name it was
                    autocomplete_container.innerHTML=""; // clear the autocomplete
                    filter_rows(); // filter the rows based on what was selected
                });
                autocomplete_container.appendChild(item); // add the item to the autocomplete container
            }
        })

        filter_rows(); // refilter the rows
        // as you type it will automatically change
    });

    // if the user clicks away then remove the autocomplete
    document.addEventListener("click", function (e) {
        autocomplete_container.innerHTML=""; // empty the autocomplete container
        
        // also remove the dropdown content
        if (!e.target.matches('.dropdownbutton')) { // if the dropwdown wasnt clicked
            document.querySelectorAll(".dropdown-content").forEach(dropdown => {
                dropdown.classList.remove('show'); // loop over all content and hide it
            });
            // this is a loop in case more dropdowns are added
        }
    });
}

function toggle_dropdown(){
    // open and close the dropdown menu
    document.getElementById("dropdown-content").classList.toggle("show");
}

// the divs containing the checkboxes for fruit and vegetable
const fruit_selector = document.getElementById("fruit_selector");
const vegetable_selector = document.getElementById("vegetable_selector");

function update_dropdown(number){
    producetype=parseInt(number); // convert to integer

    // change the text of the drop down button to match whatever the user chose
    document.getElementById("dropdownbutton").innerText = ["","All Produce","Fruit only","Vegetable only"][producetype];

    // make all checkboxes checked
    document.querySelectorAll(".produce_selector input").forEach((input) => {
        input.checked=true;
    })

    // Hide or show checkboxes based on produce type
    if (producetype === 1){ // all produce
        fruit_selector.classList.add("show");
        vegetable_selector.classList.add("show");
    } else if (producetype === 2){ // fruits only
        fruit_selector.classList.add("show");
        vegetable_selector.classList.remove("show");
    } else if (producetype === 3){ // vegetables only
        fruit_selector.classList.remove("show");
        vegetable_selector.classList.add("show");
    }

    // refilter the rows for instant effect
    filter_rows();
}

// Function that checks if user is on mobile
window.mobileCheck = function() {
    let check = false;
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    return check;
};

if (!window.mobileCheck()){
    alert("Notice: This website is built for mobile, and it seems like you using a different device. The website will work, however the design may be off.")
}