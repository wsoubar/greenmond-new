import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-npcs',
  templateUrl: './npcs.component.html',
  styleUrls: ['./npcs.component.scss']
})
export class NpcsComponent implements OnInit {

  bru = false;
  mal = false;
  tre = false;
  ven = false;
  tor = false;
  nos = false; 
  gan = false;
  cai = false;

  constructor() { }

  ngOnInit(): void {
  }

}
