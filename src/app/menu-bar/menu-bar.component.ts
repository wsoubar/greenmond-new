import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.scss']
})
export class MenuBarComponent implements OnInit {
  title = 'Greenmond';
  ativo = 'home';
  
  constructor() { }


  ngOnInit(): void {
  }

  logout () {
    console.log('logged out');
  }
  
}
