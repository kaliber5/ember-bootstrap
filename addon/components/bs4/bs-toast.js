import Component from '@ember/component';
import { layout as templateLayout, tagName } from '@ember-decorators/component';
import layout from 'ember-bootstrap/templates/components/bs-toast';
import defaultValue from 'ember-bootstrap/utils/default-decorator';
import { cancel, later } from '@ember/runloop';
import { action } from '@ember/object';
import { getTransitionDurationFromElement } from 'ember-bootstrap/utils/transition';
import { assert } from '@ember/debug';

const ClassName = {
  FADE: 'fade',
  HIDE: 'hide',
  SHOW: 'show',
  SHOWING: 'showing'
}

@templateLayout(layout)
@tagName('')
export default class BsToastComponent extends Component {
  /**
   * @property animate
   * @type Boolean
   * @default true
   * @public
   */
  @defaultValue
  animate = true;

  /**
   * Controls if the toast is hidden automatically.
   *
   * @property autohide
   * @type Boolean
   * @default true
   * @public
   */
  @defaultValue
  autohide = true;

  /**
   * Delay after which the toast is hidden if `autohide` is `true` in milliseconds.
   *
   * @property delay
   * @type Number
   * @default 500
   * @public
   */
  @defaultValue
  delay = 500;

  /**
   * Controls if the toast is shown.
   *
   * If a visible toast is removed from DOM hiding animations are not shown. Therefore it's
   * recommended to use the `@show` argument instead of wrapping the `<BsToast />` component
   * in an `{{if}}`-Block.
   *
   * @property show
   * @type Boolean
   * @defualt true
   * @public
   */
  @defaultValue
  show = true;

  /**
   * Executed after show animation has ended.
   *
   * @method onShown
   * @return void
   * @public
   */

  /**
   * Executed when toast will be hidden.
   *
   * It might be triggered by autohide or by user clicking close button.
   *
   * @method onHide
   * @return void
   * @public
   */

  /**
   * Executed after hide animation has ended.
   *
   * @method onHidden
   * @return void
   * @public
   */

  /**
   * @property autohideTimer
   * @type {Map<string,object>}
   * @private
   */
  _timers = new Map();

  /**
   * @property toastElement
   * @type {?Element}
   * @private
   */
  toastElement = null;

  /**
   * The current state of the toast. Possible states are:
   * - showing
   * - shown
   * - hiding
   * - hidden
   *
   * @property state
   * @type {String}
   * @private
   */
  get state() {
    let { toastElement } = this;
    assert('Toast element must be set before state of toast could be determined', toastElement);

    if (toastElement.classList.contains(ClassName.SHOWING)) {
      return 'showing';
    }

    if (toastElement.classList.contains(ClassName.SHOW)) {
      return 'shown';
    }

    if (toastElement.classList.contains(ClassName.HIDE)) {
      return 'hidden';
    }

    // There is no hiding class. Instead hiding state is determined by not having any of these
    // state classes. `ClassName.SHOW` is removed on the beginning of hiding animation and
    // `ClassName.HIDE` not added before the end of the hiding animation.
    return 'hiding';
  }

  /**
   * Shows the toast.
   *
   * Should be executed as soon as the toast is inserted into DOM.
   *
   * @method _show
   * @param {?Element} toastElement
   * @return void
   * @private
   */
  @action
  _show() {
    let { toastElement } = this;

    // toast must not be shown if `show` argument is false
    if (!this.show) {
      return;
    }

    // toast is only showable if it's currently hidden or hiding
    if (!['hiding', 'hidden'].includes(this.state)) {
      return;
    }

    toastElement.classList.remove(ClassName.HIDE);

    if (this.animate) {
      toastElement.classList.add(ClassName.SHOWING);

      let transitionDuration = getTransitionDurationFromElement(toastElement);
      let timer = later(this, '_onShown', transitionDuration);
      this._timers.set('onShown', timer);
    } else {
      this._onShown();
    }
  }

  /**
   * Executed at the end of show animation.
   *
   * @method _onShown
   * @return void
   * @private
   */
  _onShown() {
    let { toastElement } = this;

    toastElement.classList.remove(ClassName.SHOWING);
    toastElement.classList.add(ClassName.SHOW);

    if (typeof this.onShown === 'function') {
      this.onShown();
    }

    this._timers.delete('onShown');

    if (this.autohide) {
      let timer = later(this, '_hide', toastElement, this.delay);
      this._timers.set('hide', timer);
    }
  }

  /**
   * Hide the toast.
   *
   * @method _hide
   * @return void
   * @private
   */
  @action
  _hide() {
    let { toastElement } = this;

    // a toast could only be hidden if in show or showing state
    if (!['shown', 'showing'].includes(this.state)) {
      return;
    }

    // if toast is in showing state the animation must be canceled
    if (this.state === 'showing') {
      cancel(this._timers.onShown);
      this._timers.delete('onShown');
    }

    if (typeof this.onHide === 'function') {
      this.onHide();
    }

    this._timers.delete('hide');

    toastElement.classList.remove(ClassName.SHOW);

    if (this.animate) {
      let transitionDuration = getTransitionDurationFromElement(toastElement);
      let timer = later(this, '_onHidden', toastElement, transitionDuration);

      this._timers.set('onHidden', timer);
    } else {
      this._onHidden();
    }
  }

  /**
   * Executed at the end of hiding animation.
   *
   * @method _onHidden
   * @return void
   * @private
   */
  _onHidden() {
    let { toastElement } = this;

    toastElement.classList.add(ClassName.HIDE);

    if (typeof this.onHidden === 'function') {
      this.onHidden();
    }

    this._timers.delete('onHidden');
  }

  /**
   * Executed when the toast element is rendered.
   *
   * Responsible for registering the toastElement and initially showing the toast if `this.show`
   * is `true`. This two tasks can't be split into two separate ones (e.g. `registerToastElement`
   * and `_show`) cause the order in which modifiers are executed in not guaranteed but `_show`
   * depens on toast element being registered.
   *
   * @method _insert
   * @param {Element} toastElement
   * @return void
   * @private
   */
  @action
  _insert(toastElement) {
    this.toastElement = toastElement;

    if (this.show) {
      this._show();
    }
  }

  /**
   * Executed when ever `@show` argument changes.
   * Supports programatically showing / hiding the toast.
   *
   * @method _showArgumentChanged
   * @return void
   * @private
   */
  @action
  _showArgumentChanged() {
     if (this.show) {
      this._show();
    } else {
      this._hide();
    }
  }

  /**
   * Executed when the toast element will be destroyed.
   * Responsible for clean up work.
   *
   * @method destroy
   * @return void
   * @private
   */
  @action
  _destroy() {
    // cancel all pending timers
    for (let timer of this._timers.values()) {
      cancel(timer);
    }
    this._timers.clear();
  }
}
