import {
  Component,
  Input,
  OnInit,
  HostBinding,
  HostListener,
} from '@angular/core';
import { TabsService } from './tabs.service';

@Component({
  selector: 'md-tab-list',
  template: `
    <ng-content></ng-content>
  `,
  styles: [],
})
export class TabListComponent implements OnInit {
  /** @option Tab's anchor role type | 'tablist' */
  @Input() public role: string = 'tablist';

  private regIsCharacter: RegExp = /\S/;

  @HostBinding('class') get className(): string {
    return 'md-tab__list';
  }
  @HostBinding('attr.role') get roleName(): string {
    return this.role;
  }

  @HostListener('keyup', ['$event']) select($event) {
    this.onPress($event);
  }

  constructor(private tabsService: TabsService) {}

  ngOnInit() {}

  isPrintableCharacter = str => {
    return str.length === 1 && str.match(this.regIsCharacter);
  }

  onPress = e => {
    const key = e.keyCode;
    const tgt = e.target;
    let flag = false,
      clickEvent;

    switch (key) {
      case 32:
      case 13:
        try {
          clickEvent = new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: true,
          });
        } catch (err) {
          if (document.createEvent) {
            clickEvent = document.createEvent('MouseEvents');
            clickEvent.initEvent('click', true, true);
          }
        }
        tgt.dispatchEvent(clickEvent);
        flag = true;
        break;
      case 38:
      case 37:
        this.tabsService.setFocusPre();
        flag = true;
        break;
      case 39:
      case 40:
        this.tabsService.setFocusNext();
        flag = true;
        break;
      case 33:
      case 36:
        this.tabsService.setFocus(0);
        flag = true;
        break;
      case 34:
      case 35:
        this.tabsService.setFocusLast();
        flag = true;
        break;
      default:
        if (this.isPrintableCharacter(e.key)) {
          flag = this.tabsService.setFocusByFirstCharacter(e.key);
        }
        break;
    }

    if (flag) {
      e.stopPropagation();
      e.preventDefault();
    }
  }
}
