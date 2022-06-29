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
        return [this.inspections[this.date-1],this.fox_history[this.date-1]];
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

class Table {
    constructor() {
        this.table = document.querySelector("table") ;
        this.thead = document.querySelector("thead") ;
        this.tbody = document.querySelector("tbody") ;
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
        this.tbody.innerHTML = "";
        this.control_row();
        this.update();
    }
    
    check(hole) {
        let h = [...this.tbody.lastElementChild
            .querySelectorAll("input")]
            .filter( c=>c.checked )
            .map(c=>parseInt(c.getAttribute("data-n")));
        if ( h.length == 2 ) {
            T.move(h) ;
        }
    }

    control_row() {
        let f = G.foxes ;
        let r = document.createElement("tr");
        for ( let i = 0; i <= H.value ; ++i ) {
            let d = document.createElement("td");
            if ( i==0 ) {
                let b = document.createElement("button");
                b.innerText = "Back" ;
                b.onclick = () => T.back() ;
                d.appendChild(b);
            } else {
                d.innerHTML = (f[i-1] ? "&#129418" : "&nbsp;") + "<br>" ;
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
        this.static_row();
        if ( G.number == 0 ) {
            this.victory_row();
        } else {
            this.control_row();
        }
        this.update();
    }

    static_row() {
        let [m,f] = G.prior ;
        let r = document.createElement("tr");
        for ( let i = 0; i <= H.value ; ++i ) {
            let h = i-1; // actual hole index after first column
            let d = document.createElement("td");
            if ( i==0 ) {
                d.innerHTML = `Day ${G.day-1}`;
            } else if ( m.indexOf(h) > -1 ) {
                d.innerHTML = "&#x274c" ;
            } else if (f[h]) {
                d.innerHTML = "&#129418" ;
            } else {
                d.innerHTML = "&nbsp;" ;
            }
            r.appendChild(d);
        }
        let d = document.createElement("td");
        this.tbody.appendChild(r);
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
