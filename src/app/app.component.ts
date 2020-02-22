import { Component } from '@angular/core';
import { WebsocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'mapbox';

  constructor(
    private wsSocketService:WebsocketService
  ){

  }
}


/**
 * Todas las peticiones pasan por el app component
 */