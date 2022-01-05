// Steam id,Game,CurrentPlayers,PeakPlayersToday,ReleaseDate,ReviewSummary,TotalReviews,Tags

// https://bl.ocks.org/HarryStevens/678935d06d4601c25cb141bacd4068ce
// https://datawanderings.com/2018/08/15/d3-js-v5-promise-syntax-examples/

let ordre_ascendent = { jugadors: true, antiguitat: false, ressenyes: true, nom: false, ressenyes_per_mes: true, filtre: false };

const margin = { top: 20, right: 60, bottom: 5, left: 220 };
const width = document.getElementById("dataviz").offsetWidth - margin.left - margin.right;
const height = 865 - margin.top - margin.bottom;

// Creates sources <svg> element
const svg = d3.select("#dataviz").append("svg")
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

// Group used to enforce margin
const g = svg.append("g")
    .attr('transform', `translate(${margin.left},${margin.top})`);

// Global variable for all data
let dades;

// Scales setup
const xscale = d3.scaleLinear().range([0, width]);
const yscale = d3.scaleBand().range([0, height]).paddingInner(0.2).paddingOuter(0.4);

// Axis setup
// const xaxis = d3.axisTop().scale(xscale).ticks(5).tickFormat(d3.format(".2s")).tickFormat((d,i) => tickLabels_jugadors[i]);
const xaxis = d3.axisTop().scale(xscale);
const g_xaxis = g.append('g').attr('class', 'x axis');
const yaxis = d3.axisLeft().scale(yscale);
const g_yaxis = g.append('g').attr('class', 'y axis');


// Text x axis
svg.append("text")
    .attr("id", "xaxislabel1")
    .attr("class", "x label axis")
    .attr("text-anchor", "middle")
    .attr("x", margin.left + width)
    .attr("y", margin.top / 2)
    .text("");

svg.append("text")
    .attr("id", "xaxislabel2")
    .attr("class", "x label axis")
    .attr("text-anchor", "middle")
    .attr("x", margin.left + width)
    .attr("y", margin.top)
    .text("");

// Seleccio de dades per visualitzar inicial 
let seleccio = 'jugadors';

let avui = new Date();

let dades_filtrades;

let filtre_activat = false;

let imatges_jocs = new Array();

// https://datawanderings.com/2018/08/15/d3-js-v5-promise-syntax-examples/

const dataset = d3.csv("data/steam-top-100-nov-2021.csv")
    .then(
        (csv) => {
            dades = csv;
            for (var i = 0; i < dades.length; i++) {
                let data = new Date(toDate(dades[i].ReleaseDate));
                let dies = getDifferenceInDays(avui, data);
                let mesos = parseInt(dies / 30);
                let rxm = parseInt(dades[i].TotalReviews / mesos);
                dades[i].ressenyes_per_mes = rxm; // Camp calculat
                dades[i].seleccionat = false; // Camp de estat
                imatges_jocs.push("img/jocs/" + dades[i].SteamId + ".jpg")
            };

            actualitzar(dades);
        })
    .catch(
        (error) => {
            console.error(error);
        });

function actualitzar(les_dades) {

    // Si el filtre està activat, es mostra el botó per restaurar filtre
    if (filtre_activat) {
        document.getElementById('restaurar-filtre').style.display = "inline-block";
    }
    if (!filtre_activat) {
        document.getElementById('restaurar-filtre').style.display = "none";
    }


    if (seleccio == 'jugadors') {

        if (ordre_ascendent.jugadors) {
            les_dades.sort(function (b, a) {
                return a.PeakPlayersToday - b.PeakPlayersToday;
            });
        };
        if (!ordre_ascendent.jugadors) {
            les_dades.sort(function (b, a) {
                return b.PeakPlayersToday - a.PeakPlayersToday;
            });
        };

        //etiquetex x axis en milers (mostra 700 enlloc de 700.000)
        xaxis.tickFormat(function (d) { return d / 1000 });
        svg.select('#xaxislabel1').text("milers de jugadors");
        svg.select('#xaxislabel2').text("");

        //update the scales
        xscale.domain([0, d3.max(les_dades, (d) => parseInt(d.PeakPlayersToday))]);
        yscale.domain(les_dades.map((d) => d.Game));
    }

    if (seleccio == 'antiguitat') {

        if (ordre_ascendent.antiguitat) {
            les_dades.sort(function (b, a) {
                var a = new Date(toDate(a.ReleaseDate));
                var b = new Date(toDate(b.ReleaseDate));
                return getDifferenceInDays(a, b);
            });
        };
        if (!ordre_ascendent.antiguitat) {
            les_dades.sort(function (b, a) {
                var a = new Date(toDate(a.ReleaseDate));
                var b = new Date(toDate(b.ReleaseDate));
                return getDifferenceInDays(b, a);

            });
        };

        const valor_maxim = d3.max(les_dades, (d) => getDifferenceInDays(avui, toDate(d.ReleaseDate)));
        const anys_maxims = parseInt(valor_maxim / 365);

        //etiquetes x axis, internament son dies des de la data de publicació, però en la visualització es mostren anys.
        xaxis.tickFormat(function (d) { return parseInt(d / 365) }).ticks(anys_maxims);
        svg.select('#xaxislabel1').text("anys");
        svg.select('#xaxislabel2').text("");

        //update the scales
        xscale.domain([0, valor_maxim]);
        yscale.domain(les_dades.map((d) => d.Game));

    }

    if (seleccio == 'ressenyes') {

        if (ordre_ascendent.ressenyes) {
            les_dades.sort(function (b, a) {
                return a.TotalReviews - b.TotalReviews;
            });
        };
        if (!ordre_ascendent.ressenyes) {
            les_dades.sort(function (b, a) {
                return b.TotalReviews - a.TotalReviews;
            });
        };

        const valor_maxim = d3.max(les_dades, (d) => parseInt(d.TotalReviews));

        //etiquetes ressenyes 
        if (valor_maxim > 1000) {
            xaxis.tickFormat(function (d) { return d / 1000 }).ticks(6);
            svg.select('#xaxislabel1').text("milers de ressenyes");
        }
        if (valor_maxim > 1000000) {
            xaxis.tickFormat(function (d) { return d / 1000000 }).ticks(6);
            svg.select('#xaxislabel1').text("milions de ressenyes");
        }
        svg.select('#xaxislabel2').text("");

        //update the scales
        xscale.domain([0, valor_maxim]);
        yscale.domain(les_dades.map((d) => d.Game));
    }

    if (seleccio == 'nom') {

        if (ordre_ascendent.nom) {
            les_dades.sort(function (b, a) {
                return d3.ascending(a.Game.toLowerCase(), b.Game.toLowerCase());
            });
        };
        if (!ordre_ascendent.nom) {
            les_dades.sort(function (b, a) {
                return d3.ascending(b.Game.toLowerCase(), a.Game.toLowerCase());
            });
        };

        //update the scales
        //només yscale
        yscale.domain(les_dades.map((d) => d.Game));

    }

    if (seleccio == 'ressenyes_per_mes') {

        if (ordre_ascendent.ressenyes_per_mes) {
            les_dades.sort(function (b, a) {
                return a.ressenyes_per_mes - b.ressenyes_per_mes;
            });
        };
        if (!ordre_ascendent.ressenyes_per_mes) {
            les_dades.sort(function (b, a) {
                return b.ressenyes_per_mes - a.ressenyes_per_mes;
            });
        };

        //etiquetes ressenyes per mes

        const valor_maxim = d3.max(les_dades, (d) => parseInt(d.ressenyes_per_mes));

        let denominador;

        if (valor_maxim > 10) {
            denominador = 10;
            svg.select('#xaxislabel1').text("desenes de ressenyes");
        }
        if (valor_maxim > 100) {
            denominador = 100;
            svg.select('#xaxislabel1').text("centenars de ressenyes");
        }
        if (valor_maxim > 1000) {
            denominador = 1000;
            svg.select('#xaxislabel1').text("milers de ressenyes");
        }

        let marques = parseInt(valor_maxim / denominador);
        let primer_digit = String(marques).charAt(0);
        marques = Number(primer_digit);
        xaxis.tickFormat(function (d) { return d / denominador }).ticks(marques);
        svg.select('#xaxislabel2').text("per mes (mitjana)");

        //update the scales
        xscale.domain([0, valor_maxim]);
        yscale.domain(les_dades.map((d) => d.Game));
    }

    //render the axis
    g_xaxis.transition().call(xaxis);
    g_yaxis.transition().call(yaxis);

    // Render the chart with new data

    // DATA JOIN use the key argument for ensurign that the same DOM element is bound to the same data-item
    const rect = g.selectAll('.barres').data(les_dades, (d) => d.Game).join(
        // ENTER 
        // new elements
        (enter) => {
            // data-bs-toggle="tooltip"   data-bs-placement="bottom"
            const rect_enter = enter.append('rect').attr('class', 'barres').attr('x', 0);
            rect_enter.append('title');
            rect_enter.on("click", function () {
                d3.select(this).classed("seleccionat", d3.select(this).classed("seleccionat") ? false : true); // Intercanvia
            });
            rect_enter.on("mouseover", function () {
                canviarTextFitxa(this);
            });
            return rect_enter;
        },
        // UPDATE
        // update existing elements
        (update) => update,
        // EXIT
        // elements that aren't associated with data
        (exit) => exit.remove()
    );

    // ENTER + UPDATE
    // both old and new elements

    if (seleccio == 'jugadors') {
        rect.transition()
            .attr('height', yscale.bandwidth())
            .attr('width', (d) => xscale(d.PeakPlayersToday))
            .attr('y', (d) => yscale(d.Game));

        rect.select('title').text((d) => d.Game + ' - pic de jugadors: ' + parseInt(d.PeakPlayersToday).toLocaleString());
    }

    if (seleccio == 'antiguitat') {
        rect.transition()
            .attr('height', yscale.bandwidth())
            .attr('width', (d) => xscale(getDifferenceInDays(avui, toDate(d.ReleaseDate))))
            .attr('y', (d) => yscale(d.Game));

        rect.select('title').text((d) => d.Game + ' - data de publicació: ' + d.ReleaseDate + ' - dies des de avui: ' + parseInt(getDifferenceInDays(avui, toDate(d.ReleaseDate))).toLocaleString()
            + '- anys: ' + parseInt(getDifferenceInDays(avui, toDate(d.ReleaseDate)) / 365).toLocaleString());
    }

    if (seleccio == 'ressenyes') {
        rect.transition()
            .attr('height', yscale.bandwidth())
            .attr('width', (d) => xscale(d.TotalReviews))
            .attr('y', (d) => yscale(d.Game));

        rect.select('title').text((d) => d.Game + ' - núm.ressenyes: ' + parseInt(d.TotalReviews).toLocaleString());
    }

    if (seleccio == 'nom') {
        rect.transition()
            .attr('height', yscale.bandwidth())
            .attr('y', (d) => yscale(d.Game));
    }

    if (seleccio == 'ressenyes_per_mes') {
        rect.transition()
            .attr('height', yscale.bandwidth())
            .attr('width', (d) => xscale(d.ressenyes_per_mes))
            .attr('y', (d) => yscale(d.Game));

        rect.select('title').text(function (d) {
            return 'Ressenyes per mes: ' + d.ressenyes_per_mes.toLocaleString();
        });
    }
}


//enllaços de navegació
const navlinks = document.querySelectorAll(".nav-link");

function mostrar(s, enllac) {

    navlinks.forEach(function (n) {
        n.classList.toggle('active', false);
    });
    enllac.classList.toggle('active', true);

    if (s == seleccio) { // si és la mateixa seleccio que ja s'està mostrant, només ordenar al revés ascendent o descendent
        if (s == 'jugadors') { ordre_ascendent.jugadors = !ordre_ascendent.jugadors; };
        if (s == 'antiguitat') { ordre_ascendent.antiguitat = !ordre_ascendent.antiguitat };
        if (s == 'ressenyes') { ordre_ascendent.ressenyes = !ordre_ascendent.ressenyes };
        if (s == 'nom') { ordre_ascendent.nom = !ordre_ascendent.nom };
        if (s == 'ressenyes_per_mes') { ordre_ascendent.ressenyes_per_mes = !ordre_ascendent.ressenyes_per_mes };
    } else {
        seleccio = s;
    }
    if (filtre_activat) {
        actualitzar(dades_filtrades);
    } else {
        actualitzar(dades);
    }

}

// https://stackoverflow.com/questions/7151543/convert-dd-mm-yyyy-string-to-date
function toDate(dateStr) {
    var parts = dateStr.split("/")
    return new Date(parts[2], parts[1] - 1, parts[0])
}

function getDifferenceInDays(date1, date2) {
    const diferenciaMS = date1.getTime() - date2.getTime();
    const dies = diferenciaMS / (60 * 60 * 24 * 1000);
    return dies;
}

function getDifferenceInYearsFromToday(date1) {
    const dies = getDifferenceInDays(avui, date1);
    let anys = Math.abs(Math.round(dies / 365));
    if (anys == 0) {
        anys = 1; // Per mostrar a la barra informació
    }
    return anys;
}


//interactivity
d3.select('#mostrar_dades_filtrades').on('change', function () {
    // This will be triggered when the user selects or unselects the checkbox
    const checked = d3.select(this).property('checked');
    const elements_seleccionats = document.querySelectorAll('.seleccionat');
    let llista_per_steamid = [];
    // https://stackoverflow.com/a/9507615
    if (0 < elements_seleccionats.length) {
        elements_seleccionats.forEach(
            (e) => {
                llista_per_steamid.push(e.__data__.SteamId);
            }
        )
        dades_filtrades = dades.filter(
            (d) => llista_per_steamid.some(a => a === d.SteamId)
        );


        if (checked === true) {
            filtre_activat = true;
            actualitzar(dades_filtrades);  // Update the chart with the filtered data
        } else {
            // Checkbox was just unchecked
            filtre_activat = false;
            actualitzar(dades);  // Update the chart with all the data we have
        }
    }

    if (0 == elements_seleccionats.length) {
        var calseleccionarelementsperfiltrar = new bootstrap.Modal(document.getElementById('calseleccionarelementsperfiltrar'));
        calseleccionarelementsperfiltrar.show();
        d3.select(this).property('checked', false);
        filtre_activat = false;
    }

});

function restaurarFiltres() {
    d3.selectAll('rect').classed("seleccionat", false);
    document.getElementById('mostrar_dades_filtrades').checked = false;
    filtre_activat = false;
    actualitzar(dades);
}

function canviarTextFitxa(e) {

    const dadesdeljoc = e.__data__;
    // SteamId,Game,CurrentPlayers,PeakPlayersToday,ReleaseDate,ReviewSummary,TotalReviews,Tags

    document.getElementsByClassName('card-img-top')[0].src = 'img/jocs/' + e.__data__.SteamId + '.jpg';
    document.getElementsByClassName('card-title')[0].innerHTML = e.__data__.Game;
    document.getElementById('enllac-plana-joc-steam').href = 'https://store.steampowered.com/app/' + e.__data__.SteamId + '/';

    const _CurrentPlayers = parseInt(dadesdeljoc.CurrentPlayers).toLocaleString();
    const _PeakPlayersToday = parseInt(dadesdeljoc.PeakPlayersToday).toLocaleString();
    const _TotalReviews = parseInt(dadesdeljoc.TotalReviews).toLocaleString();
    const _ressenyes_per_mes = dadesdeljoc.ressenyes_per_mes.toLocaleString();
    let _resum_ressenyes;

    if ('Very Positive' == dadesdeljoc.ReviewSummary) { _resum_ressenyes = "Molt positives" };
    if ('Mostly Positive' == dadesdeljoc.ReviewSummary) { _resum_ressenyes = "Majorment positives" };
    if ('Mixed' == dadesdeljoc.ReviewSummary) { _resum_ressenyes = "Mixtes" };
    if ('Overwhelmingly Positive' == dadesdeljoc.ReviewSummary) { _resum_ressenyes = "Aclaparadorament positiu" };

    let markup = `
        <p>SteamID:&emsp;<strong>${dadesdeljoc.SteamId}</strong></p>
        <p>Jugadors actuals:&emsp;<strong>${_CurrentPlayers}</strong></p>
        <p>Jugadors màxims avui:&emsp;<strong>${_PeakPlayersToday}</strong></p>
        <p>Data de publicació:&emsp;<strong>${dadesdeljoc.ReleaseDate}</strong></p>
        <p>Resum ressenyes:<br><strong>${_resum_ressenyes}</strong></p>
        <p>Ressenyes totals:&emsp;<strong>${_TotalReviews}</strong></p>
        <p>Ressenyes per mes <em>(calculat)</em>: <strong>${_ressenyes_per_mes}</strong></p>
        <br>
    `;
    let text = markup;

    const etiquetes = e.__data__.Tags;
    const tags = etiquetes.split(':');

    const joc_sense_tags = (tags[0] == '');
    if (!joc_sense_tags) {
        tags.sort();
        text += '<p class="tags">';

        tags.forEach((e) => {
            text += '<span>';
            text += e;
            text += '</span> ';
        });

        text += '</p>';
    }

    document.getElementById('dades').innerHTML = text;
}

// Botó per mostrar fitxa amb dades (card)

function mostrarFitxa() {
    const e = document.getElementById('icona-mostrar-fitxa');
    const checked = e.classList.contains('text-primary');
    if (checked) {
        e.classList.replace('text-primary', 'text-secondary');
        document.getElementsByClassName('card')[0].style.visibility = "hidden";
    }
    if (!checked) {
        e.classList.replace('text-secondary', 'text-primary');
        document.getElementsByClassName('card')[0].style.visibility = "visible";
    }

}

// Precarregador d'imatges: https://www.delftstack.com/es/howto/javascript/javascript-preload-image/

function preLoader(e) {
    for (var i = 0; i < imatges_jocs.length; i++) {
        var tempImage = new Image();
        tempImage.src = imatges_jocs[i];
    }
}

this.addEventListener("DOMContentLoaded", preLoader, true);

// https://www.w3schools.com/howto/howto_js_draggable.asp

// Make the DIV element draggable:
dragElement(document.getElementsByClassName('card')[0]);

function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    if (document.getElementById(elmnt.id + "header")) {
        // if present, the header is where you move the DIV from:
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
    } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
    }

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

// Inicialitzar tooltip

var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl, {
        trigger: 'hover'
    })
})
