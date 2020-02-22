import { Component, OnInit } from '@angular/core';
import { Lugar } from '../../interfaces/interfaces';
// HttpClient
import { HttpClient } from '@angular/common/http';

import { WebsocketService } from "../../services/websocket.service";
import * as mapboxgl from 'mapbox-gl';


 // El objeto correcto es uno co una gran colección de llaves
interface RespMarcadores{
  [key:string]:Lugar
}


@Component({
  selector: "app-mapa",
  templateUrl: "./mapa.component.html",
  styleUrls: ["./mapa.component.css"]
})
export class MapaComponent implements OnInit {

  mapa: mapboxgl.Map;
  // lugares: Lugar[] = [];
  // El objeto correcto es uno co una gran colección de llaves
  lugares: RespMarcadores = {};

  markerMapBox:{[id:string]:mapboxgl.Marker}= {};

  constructor(
              private http: HttpClient,
              private wsService: WebsocketService
             ){}

  ngOnInit() {

    // cuando se inicialize este componente voy a mandar hacer la petición http 
    // para traer estos marcadores

    this.http.get<RespMarcadores>('http://localhost:5000/mapa')
        .subscribe( lugares =>{
          // console.log(lugares); // obtengo los lugares
          
          this.lugares = lugares;
        
          this.crearMapa();
        });
 
    this.escucharSockets();
  }

  escucharSockets()
  {  
  // Estaremos escuchando sockets
  
  // Cuando se crea un marcador : marcador-nuevo

  this.wsService.listen('marcador-nuevo')
      .subscribe( (marcador:Lugar ) => this.agregarMarcador(marcador));

  // Cuando se mueve un marcador : marcador-mover
  // instancia del marker setLngLat([lng,lat])

  this.wsService.listen('marcador-mover')
      .subscribe( (marcador:Lugar) => {
          this.markerMapBox[marcador.id]
            .setLngLat([marcador.lng, marcador.lat])
      });

  
  // Cuando se borra un marcador : marcador-borrar
   this.wsService
     .listen("marcador-borrar")
     .subscribe((id: string) => {
       // Mandar a llamar la función de borrar del marcador
       this.markerMapBox[id].remove(); // borra marcador y lugar
       delete this.markerMapBox[id];
     });

}

  crearMapa() {
    (mapboxgl as any).accessToken =
      "pk.eyJ1IjoicGV0ZXJhcmF5YSIsImEiOiJjazZ3cjlyZnYwZnBmM2xxbncxbHJqcno1In0.JII9Hl_ga90TXOmLc9k8dw";

    this.mapa = new mapboxgl.Map({
      container: "mapa",
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-75.75512993582937, 45.349977429009954],
      zoom: 15.8
    });

    // Agregaremos la funcion agregarMarcador
    for (const [id,marcador] of Object.entries(this.lugares)) {
      // console.log(marcador);
      this.agregarMarcador(marcador);
    }
  }


  agregarMarcador( marcador:Lugar){
      
    // const html = `<h2>${marcador.nombre}</h2>
    //               <br>
    //               <button>Borrar</button>`;


    // Necesitamos un objeto que podamos ponerle un listener
    const h2 = document.createElement('h2');
    h2.innerText = marcador.nombre;
    
    const btnBorrar = document.createElement('button');
    btnBorrar.innerText = 'Borrar';

    const div = document.createElement('div');
    div.append(h2,btnBorrar);
    
    const customPopup = new mapboxgl.Popup({
      offset:25, // que no quede sobre el marcador , que quede un poco más arriba
      closeOnClick:false //no se cierre cuando hago click afuera del mapa
    }).setDOMContent(div);
    // .setHTML(div);

    const marker = new mapboxgl.Marker({
        draggable:true, // me interesa que se pueda mover
        color:marcador.color
    })
    .setLngLat([marcador.lng, marcador.lat])
    .setPopup( customPopup )
    .addTo(this.mapa);

    // Muestro coordenadas
    marker.on('drag', () => {
        const lngLat = marker.getLngLat();
        // TODO: crear evento para emitir las cooredenadas de este marcador
        // marcador-mover
     const nuevoMarcador ={
       id:marcador.id,
       ...lngLat
     }

    //  console.log(nuevoMarcador);
    this.wsService.emit('marcador-mover', nuevoMarcador);
    
    });
    // Boton borrar
    btnBorrar.addEventListener('click', () =>{
      marker.remove();

      // decirle al servidor que borramos un marcador con id tanto
       this.wsService.emit('marcador-borrar',marcador.id);

      // TODO:  Eliminar marcador mediante socket ( debería desaparecer de todos los clientes)
    });


    this.markerMapBox[ marcador.id] = marker;
    console.log(this.markerMapBox);
  }

  crearMarcador(){
    // Para asegurarnos que cumpliremos con todas las condiciones --> usamos de tipo Lugar
    const customMarker: Lugar = {
      id: new Date().toISOString(),
      lng: -75.75512993582937,
      lat: 45.349977429009954,
      nombre: "Sin-nombre",
      color: "#" + Math.floor(Math.random() * 16777215).toString(16) // color random
    };

    this.agregarMarcador( customMarker);

    //Emitir  Marcador : marcador-nuevo
    // envio payload : con la información del marcador
    this.wsService.emit('marcador-nuevo',customMarker)


  }
}


/**
 * Notas 
 *   Una petición GET es asincrona :  en el momento que mandamos a llamar una petición get - ya se inicializo el mapa
 *   Solución : que en la creación del mapa no se inicializen los lugares(marcadores) y cuando obtengamos el crear mapa
 *              allí lo inicializemos
 *   Pero --> Lo ideal es primero obtener los lugares y cuando estos esten cargados --> inicializemos el mapa
 * 
 *   El ngFor solo trabaja con iterables o arreglos y no objetos
 *   Solución -->  Object.entries(objeto) : regresa un arreglo con todas las propiedades que tengan los lugares 
 */