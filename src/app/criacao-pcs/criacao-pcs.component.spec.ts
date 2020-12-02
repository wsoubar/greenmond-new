import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CriacaoPcsComponent } from './criacao-pcs.component';

describe('CriacaoPcsComponent', () => {
  let component: CriacaoPcsComponent;
  let fixture: ComponentFixture<CriacaoPcsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CriacaoPcsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CriacaoPcsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
