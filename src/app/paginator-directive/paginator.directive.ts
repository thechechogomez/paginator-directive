import { AfterViewInit, Directive, Host, Optional, Renderer2, Self, ViewContainerRef } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatButton } from '@angular/material/button';

interface PageObject {
  length: number;
  pageIndex: number;
  pageSize: number;
  previousPageIndex: number;
}

@Directive({
  selector: '[paginator]',
})
export class PaginatorDirective implements AfterViewInit {
  private _pageGapTxt = '...';
  private _rangeStart: number = NaN;
  private _rangeEnd: number = NaN;
  private _buttons: MatButton[] = [];
  private _curPageObj: PageObject = {
    length: 0,
    pageIndex: 0,
    pageSize: 0,
    previousPageIndex: 0,
  };

  private _showTotalPages = 3;

  get inc(): number {
    return (this._showTotalPages - 1) / 2;
  }

  get numOfPages(): number {
    return this.matPag.getNumberOfPages();
  }

  get lastPageIndex(): number {
    if (this.matPag.getNumberOfPages() === 0) {
      return 0;
    }
    return this.matPag.getNumberOfPages() - 1;
  }

  get middleIndex() {
    return (this._showTotalPages + 1) / 2;
  }

  constructor(@Host() @Self() @Optional() private readonly matPag: MatPaginator, private vr: ViewContainerRef, private ren: Renderer2) {
    this.matPag.page.subscribe((e: PageObject) => {
      if (this._curPageObj.pageSize != e.pageSize && this._curPageObj.pageIndex != 0) {
        e.pageIndex = 0;
        this._rangeStart = 0;
        this._rangeEnd = this._showTotalPages - 1;
        this.matPag.firstPage();
      }
      this._curPageObj = e;

      this.initPageRange();
    });
  }

  public ngAfterViewInit() {
    this._rangeStart = 0;
    this._rangeEnd = this._showTotalPages - 1;
    this.initPageRange();
  }

//   public ngAfterViewChecked() {      
//     this._curPageObj = {
//       length: this.matPag.length,
//       pageIndex: this.matPag.pageIndex,
//       pageSize: this.matPag.pageSize,
//       previousPageIndex: 0,
//     };
//     this.initPageRange();
//   }

  private initPageRange(): void {
    this._rangeStart = this.calcRangeStart();
    this._rangeEnd = this.calcRangeEnd();

    this.buildPageNumbers();
  }

  private calcRangeStart(): number {
    if (this.numOfPages <= this._showTotalPages) {
      return 0;
    } else if (this._curPageObj.pageIndex + this.middleIndex > this.lastPageIndex) {
      return this.numOfPages - this._showTotalPages;
    } else if (this._curPageObj.pageIndex - this.middleIndex >= 0) {
      return this._curPageObj.pageIndex - this.inc;
    }

    return 0;
  }

  private calcRangeEnd(): number {
    if (this.numOfPages <= this._showTotalPages) {
      return this.lastPageIndex;
    } else if (this._curPageObj.pageIndex + this.middleIndex > this.lastPageIndex) {
      return this.lastPageIndex;
    } else if (this._curPageObj.pageIndex - this.middleIndex >= 0) {
      return this._curPageObj.pageIndex + this.inc;
    }

    return this._showTotalPages - 1;
  }

  private buildPageNumbers() {      
    const actionContainer = this.vr.element.nativeElement.querySelector('div.mat-paginator-range-actions');
    const nextPageNode = this.vr.element.nativeElement.querySelector('button.mat-paginator-navigation-next');

    if (this._buttons.length > 0) {
      this._buttons.forEach((button) => {
        this.ren.removeChild(actionContainer, button);
      });
      this._buttons.length = 0;
    }

    if (this._rangeStart != 0) {
      this.ren.insertBefore(actionContainer, this.createButton(this._pageGapTxt, this._rangeStart), nextPageNode);
    }

    for (let i = this._rangeStart; i < this.numOfPages; i++) {
      if (i > this._rangeEnd) {
        break;
      }

      this.ren.insertBefore(actionContainer, this.createButton(i + 1, this.matPag.pageIndex), nextPageNode);
    }

    if (this._rangeEnd != this.lastPageIndex) {
      this.ren.insertBefore(actionContainer, this.createButton(this._pageGapTxt, this._rangeEnd), nextPageNode);
    }
  }

  private createButton(i: any, pageIndex: number): any {
    const linkBtn: MatButton = this.ren.createElement('button');
    const text = this.ren.createText(i);
    this.ren.addClass(linkBtn, 'paginator-btn');

    switch (i) {
      case pageIndex + 1: {
        this.ren.setAttribute(linkBtn, 'disabled', 'true');
        this.ren.addClass(linkBtn, 'paginator-btn-active');
        break;
      }

      case this._pageGapTxt: {          
        if (pageIndex === this._rangeStart) {
          let index = this._curPageObj.pageIndex - this._showTotalPages;
          if (index < 0) {
            index = 0;
          }

          this.ren.listen(linkBtn, 'click', () => {
            this.switchPage(index);
          });
        }

        if (pageIndex === this._rangeEnd) {
          let index = this._curPageObj.pageIndex + this._showTotalPages;
          if (index >= this.numOfPages) {
            index = this.lastPageIndex;
          }

          this.ren.listen(linkBtn, 'click', () => {
            this.switchPage(index);
          });
        }
        break;
      }

      default: {
        this.ren.listen(linkBtn, 'click', () => {
          this.switchPage(i - 1);
        });
        break;
      }
    }

    this.ren.appendChild(linkBtn, text);
    this._buttons.push(linkBtn);
    
    return linkBtn;
  }

  private switchPage(i: number): void {            
    this.matPag.pageIndex = i;

    this.matPag.page.next({
      pageIndex: i,
      pageSize: this.matPag.pageSize,
      length: this.matPag.length,
    });
  }
}
