import { action, computed } from '@ember/object';
import { assert } from '@ember/debug';
import Component from '@glimmer/component';
import { next, schedule } from '@ember/runloop';
import { inject as service } from '@ember/service';
import transitionEnd from 'ember-bootstrap/utils/transition-end';
import { getDestinationElement } from 'ember-bootstrap/utils/dom';
import { guidFor } from '@ember/object/internals';
import usesTransition from 'ember-bootstrap/utils/decorators/uses-transition';
import isFastBoot from 'ember-bootstrap/utils/is-fastboot';
import deprecateSubclassing from 'ember-bootstrap/utils/deprecate-subclassing';
import arg from '../utils/decorators/arg';
import { tracked } from '@glimmer/tracking';

/**
  Component for creating [Bootstrap modals](http://getbootstrap.com/javascript/#modals) with custom markup.

  ### Usage

  ```hbs
  <BsModal @onSubmit={{action "submit"}} as |Modal|>
    <Modal.header>
      <h4 class="modal-title"><i class="glyphicon glyphicon-alert"></i> Alert</h4>
    </Modal.header>
    <Modal.body>
      Are you absolutely sure you want to do that???
    </Modal.body>
    <Modal.footer as |footer|>
      <BsButton @onClick={{action Modal.close}} @type="danger">Oh no, forget it!</BsButton>
      <BsButton @onClick={{action Modal.submit}} @type="success">Yeah!</BsButton>
    </Modal.footer>
  </BsModal>
  ```

  The component yields references to the following contextual components, that you can use to further customize the output:

  * [modal.body](Components.ModalBody.html)
  * [modal.header](Components.ModalHeader.html)
  * [modal.footer](Components.ModalFooter.html)

  Furthermore references to the following actions are yielded:

  * `close`: triggers the `onHide` action and closes the modal
  * `submit`: triggers the `onSubmit` action (or the submit event on a form if present in the body element)

  ### Further reading

  See the documentation of the [bs-modal-simple](Components.ModalSimple.html) component for further examples.

  *Note that only invoking the component in a template as shown above is considered part of its public API. Extending from it (subclassing) is generally not supported, and may break at any time.*

  @class Modal
  @namespace Components
  @extends Glimmer.Component
  @public
*/
@deprecateSubclassing
export default class Modal extends Component {
  @service('-document')
  document;

  /**
   * Set to false to disable fade animations.
   *
   * @property fade
   * @type boolean
   * @default true
   * @public
   */

  get _fade() {
    let isFB = isFastBoot(this);
    return this.args.fade === undefined ? !isFB : this.args.fade;
  }

  /**
   * @property paddingLeft
   * @type number|undefined
   * @private
   */
  @tracked
  paddingLeft;

  /**
   * @property paddingRight
   * @type number|undefined
   * @private
   */
  @tracked
  paddingRight;

  /**
   * Visibility of the modal. Toggle to show/hide with CSS transitions.
   *
   * When the modal is closed by user interaction this property will not update by using two-way bindings in order
   * to follow DDAU best practices. If you want to react to such changes, subscribe to the `onHide` action
   *
   * @property open
   * @type boolean
   * @default true
   * @public
   */

  /**
   * Use a semi-transparent modal background to hide the rest of the page.
   *
   * @property backdrop
   * @type boolean
   * @default true
   * @public
   */
  @arg
  backdrop = true;

  /**
   * @property isBackdropShown
   * @type boolean
   * @private
   */
  @tracked
  isBackdropShown = false;

  /**
   * Closes the modal when escape key is pressed.
   *
   * @property keyboard
   * @type boolean
   * @default true
   * @public
   */
  @arg
  keyboard = true;

  /**
   * [BS4 only!] Vertical position, either 'top' (default) or 'center'
   * 'center' will apply the `modal-dialog-centered` class
   *
   * @property position
   * @type {string}
   * @default 'top'
   * @public
   */
  @arg
  position = 'top';

  /**
   * [BS4 only!] Allows scrolling within the modal body
   * 'true' will apply the `modal-dialog-scrollable` class
   *
   * @property scrollable
   * @type boolean
   * @default false
   * @public
   */
  @arg
  scrollable = false;

  /**
   * @property dialogComponent
   * @type {String}
   * @private
   */

  /**
   * @property headerComponent
   * @type {String}
   * @private
   */

  /**
   * @property bodyComponent
   * @type {String}
   * @private
   */

  /**
   * @property footerComponent
   * @type {String}
   * @private
   */

  /**
   * Controls if the modal is rendered in the DOM.
   *
   * It must be kept in sync with the non-tracked property `state`.
   * To avoid getting out of sync it should be set only by the setter
   * of `state` property.
   */
  @tracked isInDom = this.state !== 'closed';

  /**
   * Controls if the modal is visible.
   *
   * It must be kept in sync with the non-tracked property `state`.
   * To avoid getting out of sync it should be set only the setter
   * of `state` property.
   */
  @tracked isShowModal = this.state === 'open' || this.state === 'opening';

  /**
   * Current state of the modal.
   *
   * Possible values:
   * - 'opening'
   * - 'open'
   * - 'closing'
   * - 'closed'
   *
   * Setting it to `'closed'` also updates the `isModalShown` tracked
   * property.
   *
   * State can not be tracked itself. The methods to show and hide the modal
   * must read the current state before setting it. Otherwise the methods may
   * try to show a modal, which is already shown or hide a modal, which is
   * already hidden.
   *
   * @property state
   * @private
   */
  get state() {
    return this._state;
  }
  set state(value) {
    this._state = value;
    this.isInDom = value !== 'closed';
    this.isShowModal = value === 'open' || value === 'opening';
  }
  _state = 'closed';

  get isOpen() {
    return this.state === 'open';
  }

  get isOpening() {
    return this.state === 'opening';
  }

  get isClosing() {
    return this.state === 'closing';
  }

  get isClosed() {
    return this.state === 'closed';
  }

  /**
   * The id of the `.modal` element.
   *
   * @property modalId
   * @type string
   * @readonly
   * @private
   */
  get modalId() {
    return `${guidFor(this)}-modal`;
  }

  /**
   * The id of the backdrop element.
   *
   * @property backdropId
   * @type string
   * @readonly
   * @private
   */
  get backdropId() {
    return `${guidFor(this)}-backdrop`;
  }

  /**
   * Property for size styling, set to null (default), 'lg' or 'sm'
   *
   * Also see the [Bootstrap docs](http://getbootstrap.com/javascript/#modals-sizes)
   *
   * @property size
   * @type String
   * @public
   */

  /**
   * If true clicking on the backdrop will close the modal.
   *
   * @property backdropClose
   * @type boolean
   * @default true
   * @public
   */
  @arg
  backdropClose = true;

  /**
   * If true component will render in place, rather than be wormholed.
   *
   * @property renderInPlace
   * @type boolean
   * @default false
   * @public
   */
  @arg
  renderInPlace = false;

  /**
   * @property _renderInPlace
   * @type boolean
   * @private
   */
  get _renderInPlace() {
    return this.renderInPlace || !this.destinationElement;
  }

  /**
   * The duration of the fade transition
   *
   * @property transitionDuration
   * @type number
   * @default 300
   * @public
   */
  @arg
  transitionDuration = 300;

  /**
   * The duration of the backdrop fade transition
   *
   * @property backdropTransitionDuration
   * @type number
   * @default 150
   * @public
   */
  @arg
  backdropTransitionDuration = 150;

  /**
   * Use CSS transitions?
   *
   * @property usesTransition
   * @type boolean
   * @readonly
   * @private
   */
  @usesTransition('_fade')
  usesTransition;

  destinationElement = getDestinationElement(this);

  /**
   * The DOM element of the `.modal` element.
   *
   * @property modalElement
   * @type object
   * @readonly
   * @private
   */
  get modalElement() {
    return document.getElementById(this.modalId);
  }

  /**
   * The DOM element of the backdrop element.
   *
   * @property backdropElement
   * @type object
   * @readonly
   * @private
   */
  get backdropElement() {
    return document.getElementById(this.backdropId);
  }

  /**
   * The action to be sent when the modal footer's submit button (if present) is pressed.
   * Note that if your modal body contains a form (e.g. [Components.Form](Components.Form.html)) this action will
   * not be triggered. Instead a submit event will be triggered on the form itself. See the class description for an
   * example.
   *
   * @property onSubmit
   * @type function
   * @public
   */

  /**
   * The action to be sent when the modal is closing.
   * This will be triggered by pressing the modal header's close button (x button) or the modal footer's close button.
   * Note that this will happen before the modal is hidden from the DOM, as the fade transitions will still need some
   * time to finish. Use the `onHidden` if you need the modal to be hidden when the action triggers.
   *
   * You can return false to prevent closing the modal automatically, and do that in your action by
   * setting `open` to false.
   *
   * @property onHide
   * @type function
   * @public
   */

  /**
   * The action to be sent after the modal has been completely hidden (including the CSS transition).
   *
   * @property onHidden
   * @type function
   * @default null
   * @public
   */

  /**
   * The action to be sent when the modal is opening.
   * This will be triggered immediately after the modal is shown (so it's safe to access the DOM for
   * size calculations and the like). This means that if fade=true, it will be shown in between the
   * backdrop animation and the fade animation.
   *
   * @property onShow
   * @type function
   * @default null
   * @public
   */

  /**
   * The action to be sent after the modal has been completely shown (including the CSS transition).
   *
   * @property onShown
   * @type function
   * @public
   */

  /**
   * @property isFastBoot
   * @type boolean
   * @private
   */
  isFastBoot = isFastBoot(this);

  @action
  close() {
    if (this.args.onHide?.() !== false) {
      this.hide();
    }
  }

  @action
  doSubmit() {
    // replace modalId by :scope selector if supported by all target browsers
    let modalId = this.modalId;
    let forms = this.modalElement.querySelectorAll(`#${modalId} .modal-body form`);
    if (forms.length > 0) {
      // trigger submit event on body forms
      let event = document.createEvent('Events');
      event.initEvent('submit', true, true);
      Array.prototype.slice.call(forms).forEach((form) => form.dispatchEvent(event));
    } else {
      // if we have no form, we send a submit action
      this.args.onSubmit?.();
    }
  }

  /**
   * Show the modal
   *
   * @method show
   * @private
   */
  async show() {
    if (this.isOpening || this.isOpen) {
      return;
    }

    this.state = 'opening';

    this.addBodyClass();

    await this.showBackdrop();

    if (this.isDestroyed) {
      return;
    }

    this.checkScrollbar();
    this.setScrollbar();

    await new Promise((resolve) => {
      schedule('afterRender', async () => {
        let { modalElement, usesTransition, transitionDuration } = this;

        if (!modalElement) {
          return;
        }

        modalElement.scrollTop = 0;
        this.adjustDialog();
        this.state = 'open';
        this.args.onShow?.();

        if (usesTransition) {
          await transitionEnd(modalElement, transitionDuration);
        }

        if (this.isDestroyed) {
          return;
        }

        this.args.onShown?.();

        resolve();
      });
    });
  }

  /**
   * Hide the modal
   *
   * @method hide
   * @private
   */
  async hide() {
    if (this.isClosing || this.isClosed) {
      return;
    }

    this.state = 'closing';

    if (this.usesTransition) {
      await transitionEnd(this.modalElement, this.transitionDuration);
    }

    this.hideModal();
  }

  /**
   * Clean up after modal is hidden and call onHidden
   *
   * @method hideModal
   * @private
   */
  async hideModal() {
    if (this.isDestroyed) {
      return;
    }

    await this.hideBackdrop();

    if (this.isDestroyed) {
      return;
    }

    this.removeBodyClass();
    this.resetAdjustments();
    this.resetScrollbar();
    this.state = 'closed';
    this.args.onHidden?.();
  }

  /**
   * Show the backdrop
   *
   * @method showBackdrop
   * @param callback
   * @private
   */
  async showBackdrop() {
    if (!this.backdrop) {
      return;
    }

    this.isBackdropShown = true;

    await new Promise((resolve) => {
      next(async () => {
        if (!this.backdrop) {
          return;
        }

        let { backdropElement, usesTransition } = this;
        assert('Backdrop element should be in DOM', backdropElement);

        if (usesTransition) {
          await transitionEnd(backdropElement, this.backdropTransitionDuration);
        }

        resolve();
      });
    });
  }

  /**
   * Hide the backdrop
   *
   * @method hideBackdrop
   * @private
   */
  async hideBackdrop() {
    if (!this.backdrop) {
      return;
    }

    let { backdropElement, usesTransition } = this;
    assert('Backdrop element should be in DOM', backdropElement);

    if (usesTransition) {
      await transitionEnd(backdropElement, this.backdropTransitionDuration);
    }

    if (this.isDestroyed) {
      return;
    }

    this.isBackdropShown = false;
  }

  /**
   * @method adjustDialog
   * @private
   */
  @action
  adjustDialog() {
    if (this.isClosed) {
      return;
    }

    let modalIsOverflowing = this.modalElement.scrollHeight > document.documentElement.clientHeight;
    this.paddingLeft = !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : undefined;
    this.paddingRight = this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : undefined;
  }

  /**
   * @method resetAdjustments
   * @private
   */
  resetAdjustments() {
    this.paddingLeft = undefined;
    this.paddingRight = undefined;
  }

  /**
   * @method checkScrollbar
   * @private
   */
  checkScrollbar() {
    let fullWindowWidth = window.innerWidth;
    if (!fullWindowWidth) {
      // workaround for missing window.innerWidth in IE8
      let documentElementRect = document.documentElement.getBoundingClientRect();
      fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
    }

    this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
  }

  /**
   * @method setScrollbar
   * @private
   */
  setScrollbar() {
    let bodyPad = parseInt(document.body.style.paddingRight || 0, 10);
    this._originalBodyPad = document.body.style.paddingRight || '';
    if (this.bodyIsOverflowing) {
      document.body.style.paddingRight = bodyPad + this.scrollbarWidth;
    }
  }

  /**
   * @method resetScrollbar
   * @private
   */
  resetScrollbar() {
    if (isFastBoot(this)) {
      return;
    }

    document.body.style.paddingRight = this._originalBodyPad;
  }

  addBodyClass() {
    // special handling for FastBoot, where real `document` is not available
    if (isFastBoot(this)) {
      // a SimpleDOM instance with just a subset of the DOM API!
      let document = this.document;

      let existingClasses = document.body.getAttribute('class') || '';
      if (!existingClasses.includes('modal-open')) {
        document.body.setAttribute('class', `modal-open ${existingClasses}`);
      }
    } else {
      document.body.classList.add('modal-open');
    }
  }

  removeBodyClass() {
    if (isFastBoot(this)) {
      // no need for FastBoot support here
      return;
    }

    document.body.classList.remove('modal-open');
  }

  /**
   * @property scrollbarWidth
   * @type number
   * @readonly
   * @private
   */
  @computed('modalElement')
  get scrollbarWidth() {
    let scrollDiv = document.createElement('div');
    scrollDiv.className = 'modal-scrollbar-measure';
    let modalEl = this.modalElement;
    modalEl.parentNode.insertBefore(scrollDiv, modalEl.nextSibling);
    let scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    scrollDiv.parentNode.removeChild(scrollDiv);
    return scrollbarWidth;
  }

  willDestroy() {
    super.willDestroy(...arguments);

    this.removeBodyClass();
    this.resetScrollbar();
  }

  @action
  handleVisibilityChanges() {
    if (this.args.open !== false) {
      this.show();
    } else {
      this.hide();
    }
  }
}
