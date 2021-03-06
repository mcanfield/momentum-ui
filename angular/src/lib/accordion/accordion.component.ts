
import {
  AfterContentInit, Component, ElementRef, Input, OnInit, Output, EventEmitter,
  ContentChildren, QueryList, ChangeDetectorRef, Inject, forwardRef, ViewChild, AfterViewInit
} from '@angular/core';

import { AccordionService } from './accordion.service';

@Component({
  selector: 'md-accordion-tab',
  template: `
    <div
      [attr.aria-expanded]="isExpanded"
      class="md-accordion__group"
      [ngClass]="tabWrapperClasses"
    >
      <div
        #headerRef
        role="button"
        class="md-accordion__header"
        [ngClass]="headerClasses"
        (click) = "toggle($event)"
        (keydown)="onKeyDown($event)"
        [attr.tabindex]="!disabled ? 0 : -1"
      >
        <div>{{header}}</div>
        <span class="md-accordion__header-icon"></span>
      </div>

      <div class="md-accordion__content">
        <div
          class="md-list-item"
          id="md-list-item-12"
          role="listItem"
          (click) = "handleContentClick($event)"
        >
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
})
export class AccordionTabComponent implements OnInit, AfterViewInit {

  /** @prop Set Accordion tab header string | false  */
  @Input() header: string = '';
  /** @prop Set accordion tab to be expanded | false  */
  @Input() isExpanded: boolean = false;
  /** @prop Set the attribute disabled to the accordion tab | false */
  @Input() disabled: boolean = false;
  /** @prop Optional accordion tab css class string | '' */
  @Input() tabClass: string = '';
  /** @prop Set the height of the AccordionHeader to either the default or 56px | '' */
  @Input() height: number;
  /** @prop Optional underline under Accordion menu item | false */
  @Input() showSeparator: boolean = false;
  /** @prop Optional accordion header css class string | '' */
  @Input() headerClass: string = '';

  @ViewChild('headerRef') headerRef: ElementRef;
  @ViewChild('contentRef') contentRef: ElementRef;

  /** @prop Handler to be called when the user taps the Accordion Tab | null */
  @Output() contentClick: EventEmitter<any> = new EventEmitter();
  /** @prop Handler to be called when the user presses a key | null */
  @Output() handleKeyDown: EventEmitter<any> = new EventEmitter();

  index;

  focus;

  constructor(
    // tslint:disable-next-line: no-use-before-declare
    @Inject(forwardRef(() => AccordionComponent)) public accordion: AccordionComponent,
    private el: ElementRef,
    private accordionService: AccordionService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    if (this.height && this.height !== 56) {
      throw new Error(`md-list: Accordion Header height option must be either the default or 56`);
    }
    this.accordionService.focus$.subscribe(focus => this.focus = focus);
  }

  ngAfterViewInit() {
    this.index = this.findTabIndex();
    this.cdr.detectChanges();
  }

  handleContentClick(event: Event) {
    this.contentClick.emit({ originalEvent: event, tab: this.accordion.tabs[this.index] });

    event.stopPropagation();
  }

  toggle(event) {
    if (this.disabled) {
      return false;
    }
    this.index = this.findTabIndex();

    this.accordionService.changeFocus(this.index);

    if (this.isExpanded) {
      this.isExpanded = false;
    } else {
      if (!this.accordion.multipleVisible) {
        for (let i = 0; i < this.accordion.tabs.length; i++) {
          this.accordion.tabs[i].isExpanded = false;
        }
      }
      this.isExpanded = true;
    }
    event.preventDefault();
  }

  findTabIndex() {
    let index = -1;

    this.accordion.tabs.map((tab, idx) => {
      if (tab === this) {
        index = idx;
      }
    });
    return index;
  }

  getNewIndex(currentIndex, change, lastIdx) {

    const getPossibleIndex = () => {
      if (currentIndex + change < 0) {
        return lastIdx;
      } else if (currentIndex + change > lastIdx) {
        return 0;
      }
      return currentIndex + change;
    };
    const possibleIndex = getPossibleIndex();

    if (this.accordion.tabs[possibleIndex].disabled) {
      return this.getNewIndex(possibleIndex, change, lastIdx);
    }
    return possibleIndex;
  }

  onKeyDown(event: KeyboardEvent) {
    let newIndex;

    this.handleKeyDown.emit(event.code);

    switch (event.code) {
      case 'Space':
      case 'Enter':
        this.toggle(event);

        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        newIndex = this.getNewIndex(this.index, -1, this.accordion.tabs.length - 1);

        this.accordionService.changeFocus(newIndex);

        if (this.accordion.tabs[this.focus]) {
          this.accordion.tabs[this.focus].headerRef.nativeElement.focus();
        }
        break;

      case 'Tab':
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = this.getNewIndex(this.index, 1, this.accordion.tabs.length - 1);

        this.accordionService.changeFocus(newIndex);

        if (this.accordion.tabs[this.focus]) {
          this.accordion.tabs[this.focus].headerRef.nativeElement.focus();
        }

        break;

      case 'PageUp':
      case 'Home':
        this.accordionService.changeFocus(0);
        this.accordion.tabs[0].headerRef.nativeElement.focus();

        break;

      case 'PageDown':
      case 'End':
        this.accordionService.changeFocus(this.accordion.tabs.length - 1);
        this.accordion.tabs[this.accordion.tabs.length - 1].headerRef.nativeElement.focus();

        break;

      default:
        break;
    }
    event.preventDefault();
  }

  get tabWrapperClasses() {
    return {
      ['md-accordion__group--disabled']: this.disabled,
      'md-accordion__group--active': this.isExpanded,
      [this.tabClass]: this.tabClass
    };
  }

  get headerClasses() {
    return {
      ['md-accordion__header--' + this.height]: this.height === 56,
      'md-accordion__header--separator': this.showSeparator,
      [this.headerClass]: this.headerClass
    };
  }
}

// Accordion Below

@Component({
  selector: 'md-accordion',
  template: `
    <div
      class="md-accordion"
      [ngClass]="wrapperClasses"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [],
})
export class AccordionComponent implements AfterContentInit, AfterViewInit {
  /** @prop Set to allow expansion of multiple AccordionGroups | false */
  @Input() multipleVisible: boolean = false;
  /** @prop Optional css class string | '' */
  @Input() class: string = '';
  /** @prop Specifies if AccordionHeader automatically gets focus when page loads | false  */
  @Input() focus: boolean = false;

  @ContentChildren(AccordionTabComponent) tabList: QueryList<AccordionTabComponent>;

  public tabs: AccordionTabComponent[] = [];

  constructor() { }

  ngAfterContentInit() {
    this.tabs = this.tabList.toArray();
  }

  ngAfterViewInit() {
    if (this.focus) {
      this.tabs[0].headerRef.nativeElement.focus();
    }
  }

  get wrapperClasses() {
    return {
      [this.class]: this.class,
    };
  }
}
