"use strict";

/* jshint esversion: 6 */

class Holes {
    constructor() {
        this.item = document.getElementById("holes");
        this.read();
    }

    read() {
        // get Number of holes from input field
        let n = parseInt(this.item.value);
        let update = true ;
        if (n<1) {
            // bad input
            n = 5 ;
        } else if (n<2) {
            n = 2;
        } else if ( n>12 ) {
            n = 12;
        } else {
            update = false;
        }
        if (update) {
            this.item.value=n;
        }
        this.holes = n;
    }

    get change() {
        let h = this.holes ;
        this.read();
        return ( h != this.holes ) ;
    }

    get value() {
        return this.holes;
    }
}
var H = new Holes() ;

class Game {
    constructor () {
        this.start();
    }

    start () {
        this.inspections = [];
        this.date = 0;
        let current_fox = Array(H.value).fill(true);
        let current_stats = Array(H.value).fill( 1. / H.value );
        this.fox_history = [current_fox] ;
        this.stats_history = [current_stats];
        this.inspections = [] ;
    }

    escapes (i) { // returns an array of landing spots
        return [
            i==0 ? H.value-1 : i-1,
            i==H.value -1 ? 0 : i+1,
            ] ;
    }

    move( holes ) { // holes is an array
        console.log(holes);
        // inspections are 0-based
        this.inspections[this.date] = holes ;
        this.date += 1;

        // use previous fox locations
        let old_locations = this.fox_history[this.date-1].slice() ;
        let old_stats = this.stats_history[this.date-1].slice() ;

        // exclude inspected hole
        holes.forEach( h => {
            old_locations[h] = false ;
            old_stats[h] = 0. ;
            });

        let current_fox = Array(H.value).fill(false) ;
        let current_stats = Array(H.value).fill(0) ;
        
        for ( let h = 0 ; h < H.value ; ++h ) {
            let e = this.escapes(h) ; // where fox can go
            e.forEach( ee => current_fox[h] ||= old_locations[ee] );
            e.forEach( ee => current_stats[h] += old_stats[ee]/e.length );
        }

        // exclude poisoned hole again (can't move into it)
        holes.forEach( h => {
            current_fox[h] = false ;
            current_stats[h] = 0. ;
            });

        // store
        this.fox_history[this.date] = current_fox;
        this.stats_history[this.date] = current_stats;
    }

    get foxes() {
        return this.fox_history[this.date] ;
    }

    get stats() {
        return this.stats_history[this.date] ;
    }

    get prior() {
        return [this.inspections[this.date-1]||[],this.inspections[this.date-2]||[],this.fox_history[this.date-1]];
    }

    back() { // backup a move
        this.date -= 1 ;
    }

    get number() { // of foxes left
        return this.fox_history[this.date].filter(f=>f).length ;
    }

    get day() {
        return this.date;
    }
}
var G = new Game();

class GardenView {
    constructor() {
        this.svg = document.getElementById("svg");
    }

    start() {
        this.history = [] ;
    }

    back() {
        this.history.pop();
    }

    add_history_row(s) {
        let Th = s.map( (_,i) => `<g id=${"bottom_"+i}><use href="#old_hole" transform="rotate(${360.*i/s.length})" /></g>`).join("");
        let Tf = s.map( (ss,i) => `<g transform="rotate(${360.*i/s.length})"><text class="old_fox" x="42" y="580" rotate="180">${ss}</text></g>`).join("");
        this.history.push( `<circle cx="0" cy="0" r="600" stroke="grey" stroke-width="3" fill="none" />
            <def><circle id="old_hole" cx="0" cy="600" r="50" /></def>
            ${Th}${Tf}`);
    }
        
    show_history() {
        if ( this.history.length == 0 ) {
            return "";
        }
        return this.history.reduce( (t,x) => `<g transform="scale(.83)">${t}</g>${x}` );
    }

    create_svg(s) {
        let f = G.foxes ;
        let Th = s.map( (_,i) => `<g id=${"bottom_"+i}><use href="#svg_hole" transform="rotate(${360.*i/s.length})" /></g>`).join("");
        let Tf = s.map( (ss,i) => `<g transform="rotate(${360.*i/s.length})"><text class="svg_fox" x="125" y="740" rotate="180">${ss}</text></g>`).join("");
        let Tl = f.map( (ff,i) => `<use href=${ff?"#svg_larrow":"#svg_nofox"} transform="rotate(${360.*i/f.length})" />`).join("");
        let Tr = f.map( (ff,i) => `<use href=${ff?"#svg_rarrow":"#svg_nofox"} transform="rotate(${360.*i/f.length})" />`).join("");
        let Tc = s.map( (_,i) => `<use href="#svg_click" data-hole=${i+""} id=${"top_"+i} transform="rotate(${360.*i/s.length})" />`).join("");
        return `<svg viewBox="-1000 -1000 2000 2000">
            <circle cx="0" cy="0" r="803" stroke="grey" stroke-width="3" fill="none" />
            <circle cx="0" cy="0" r="797" stroke="grey" stroke-width="3" fill="none" />
            <def>
                <circle id="svg_hole" cx="0" cy="800" r="150" />
                <text id="svg_rarrow" x="100" y="790" rotate="-15">&#8594;</text>
                <text id="svg_larrow" x="-300" y="740" rotate="15">&#8592;</text>
                <circle id="svg_click" cx="0" cy="800" r="150" />
            </def>
            ${Th}
            ${Tf}
            ${Tl}
            ${Tr}
            ${Tc}
            ${this.show_history()}
            Sorry, your browser does not support inline SVG.  
        </svg>` ;
    }

    control_row(symbol_list) {
        this.svg.innerHTML = this.create_svg(symbol_list) ;
        this.svg.onload = G.foxes.forEach( (_,i)=>document.getElementById("top_"+i).addEventListener('click', (e) => T.click(e.target.id.split('_')[1]) ));
    }
}
var GV = new GardenView();

class Table {
    constructor() {
        this.table = document.querySelector("table") ;
        this.thead = this.table.querySelector("thead") ;
        this.tbody = this.table.querySelector("tbody") ;
        this.stats = false;
        this.start() ;
    }

    stats_row() {
        let r = document.createElement("tr");
        let h = document.createElement("th");
        h.innerText = "Probability" ;
        r.appendChild(h) ;
        for ( let i = 1 ; i <= H.value ; ++i ) {
            h = document.createElement("th");
            r.appendChild(h) ;
        }
        this.thead.insertBefore(r,this.thead.firstElementChild);
    }

    statchange() {
        let s = this.stats ;
        this.stats = document.getElementById("stats").checked ;
        if (s == this.stats ) {
        } else if ( this.stats ) {
            this.stats_row() ;
            this.update() ;
        } else {
            this.thead.removeChild(this.thead.firstElementChild);
        }
    }

    start() {
        this.header();
        G.start();
        GV.start();
        this.tbody.innerHTML = "";
        this.control_row();
        this.update();
    }
    
    click(hole) {
        [...this.tbody.lastElementChild
            .querySelectorAll("input")]
            .filter( i=>parseInt(i.getAttribute("data-n"))==hole )[0].click();
    }

    check(hole) {
        let h = [...this.tbody.lastElementChild
            .querySelectorAll("input")]
            .filter( c=>c.checked )
            .map(c=>parseInt(c.getAttribute("data-n")));
        if ( h.length == 1 ) {
            this.move(h) ;
        }
    }

    control_row() {
        let f = G.foxes ;
        let r = document.createElement("tr");
        let s = this.symbols( [], [], f );
        for ( let i = 0; i <= H.value ; ++i ) {
            let d = document.createElement("td");
            if ( i==0 ) {
                let b = document.createElement("button");
                b.innerText = "Back" ;
                b.onclick = () => T.back() ;
                d.appendChild(b);
            } else {
                d.innerHTML = s[i-1] + "<br>" ;
                let b = document.createElement("input");
                b.type = "checkbox";
                b.onclick = () => T.check(i-1) ;
                b.setAttribute("data-n",i-1);
                d.appendChild(b);
            }
            r.appendChild(d);
        }
        let d = document.createElement("td");
        this.tbody.appendChild(r);
        GV.control_row(s);
    }

    back() {
        if ( G.day < 2 ) {
            this.start() ;
        } else {
            this.remove_row();
            this.remove_row();
            G.back();
            this.control_row();
        }
        this.update();
    }

    update() {
        document.getElementById("raided").value=G.day*2;
        if ( this.stats ) {
            let p = this.thead.firstElementChild.childNodes;
            G.stats.forEach( (v,i) => p[i+1].innerText = v.toFixed(3) );
        }
    }
        

    move(holes) { // hole 0-based
        G.move(holes);
        this.remove_row();
        this.add_history_row();
        if ( G.number == 0 ) {
            this.victory_row();
        } else {
            this.control_row();
        }
        this.update();
    }

    symbols( moves, poisons, foxes ) {
        // moves = list of inspection holes
        // poisons = list of poisoned holes
        // foxes = true/false fox occupation list
        // returns a symbol list
        let s = foxes.map( f => f?"&#129418;":"&nbsp;" ) ;
        moves.forEach( m => s[m] = "&#x274c;" );
        poisons.forEach( p => s[p] = "&#9760;" );
        return s ;
    } 

    add_history_row() { // historical row
        let [m,p,f] = G.prior ;
        let r = document.createElement("tr");
        let s = this.symbols( m, p, f );
        for ( let i = 0; i <= H.value ; ++i ) {
            let d = document.createElement("td");
            if ( i==0 ) {
                d.innerHTML = `Day ${G.day-1}`;
            } else {
                d.innerHTML = s[i-1] ;
            }
            r.appendChild(d);
        }
        let d = document.createElement("td");
        this.tbody.appendChild(r);
        GV.add_history_row(s);
    }

    remove_row() {
        this.tbody.removeChild( this.tbody.lastChild ) ;
    }

    victory_row() {
    }

    header() {
        this.thead.innerHTML = "";
        let r = document.createElement("tr");
        let h = document.createElement("th");
        h.innerText = "Day" ;
        r.appendChild(h) ;
        for ( let i = 1 ; i <= H.value ; ++i ) {
            h = document.createElement("th");
            h.innerText = i + "" ;
            r.appendChild(h) ;
        }
        this.thead.appendChild(r) ;
    }
    
}
var T = new Table();             

function changeInput() {
    if ( H.change ) {
        T.start() ;
    }
}

class Overlay {
	constructor () {
		this.Garden( true ) ;
	}
	
	Garden( onstate ) {
		if ( onstate ) {
			document.getElementById("svg").style.zIndex="1";
			document.getElementById("Bgarden").style.backgroundColor = "white";
			document.getElementById("Btable").style.backgroundColor = "grey";
		} else {
			document.getElementById("svg").style.zIndex="-1";
			document.getElementById("Bgarden").style.backgroundColor = "grey";
			document.getElementById("Btable").style.backgroundColor = "white";
		}
	}
}
var O = new Overlay();

// Application starting point
window.onload = () => {
    // Initial splash screen

    // Stuff into history to block browser BACK button
    window.history.pushState({}, '');
    window.addEventListener('popstate', ()=>window.history.pushState({}, '') );

    // Service worker (to manage cache for off-line function)
    if ( 'serviceWorker' in navigator ) {
        navigator.serviceWorker
        .register('/sw.js')
        .catch( err => console.log(err) );
    }
    
};
