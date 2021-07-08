import { tagName } from '@ember-decorators/component';
import { observes } from '@ember-decorators/object';
import { action, computed } from '@ember/object';
import { filter, gt, lte, readOnly } from '@ember/object/computed';
import CarouselSlide from 'ember-bootstrap/components/bs-carousel/slide';
import Component from '@ember/component';
import ComponentParent from 'ember-bootstrap/mixins/component-parent';
import { schedule, scheduleOnce } from '@ember/runloop';
import { task, timeout } from 'ember-concurrency';
import RSVP from 'rsvp';
import defaultValue from 'ember-bootstrap/utils/default-decorator';
import { equal } from '@ember/object/computed';
import deprecateSubclassing from 'ember-bootstrap/utils/deprecate-subclassing';

/**
  Ember implementation of Bootstrap's Carousel. Supports all original features but API is partially different:

  | Description | Original | Component |
  | ------ | ------ | ------ |
  | Autoplays after first user event or on page load. | ride='carousel'\|false | autoPlay=false\|true |
  | Disable automatic cycle. | interval=false | interval=0 |
  | If first slide should follow last slide on "previous" event, the opposite will also be true for "next" event. | wrap=false\|true | wrap=false\|true |
  | Jumps into specific slide index | data-slide-to=n | index=n |
  | Keyboard events. | keyboard=false\|true | keyboard=false\|true |
  | Left-to-right or right-to-left sliding. | N/A |  ltr=false\|true |
  | Pause current cycle on mouse enter. | pause='hover'\|null | pauseOnMouseEnter=false\|true |
  | Show or hide controls  | Tag manipulation. | showControls=false\|true |
  | Show or hide indicators  | Tag manipulation. | showIndicators=false\|true |
  | Waiting time of slides in a automatic cycle. | interval=n | interval=n |

  Default settings are the same as the original so you don't have to worry about changing parameters.

  The component yields a hash with the following properties:
  * `slide`: the component that would be used for rendering the carousel slide.
  * `toPrevSlide`: function to change change the carousel to the previous slide.
  * `toNextSlide`: function to change change the carousel to the next slide.

  ```hbs
  <BsCarousel as |car|>
    <car.slide>
      <img alt="First slide" src="slide1.jpg">
    </car.slide>
    <car.slide>
      <img alt="Second slide" src="slide2.jpg">
    </car.slide>
    <car.slide>
      <img alt="Third slide" src="slide3.jpg">
    </car.slide>
  </BsCarousel>
  ```

  To better understand the whole documentation, you should be aware of the following operations:

  | Operation | Description |
  | ------ | ------ |
  | Transition | Swaps two slides. |
  | Interval | Waiting time after a transition. |
  | Presentation | Represents a single transition, or a single interval, or the union of both. |
  | Cycle | Presents all slides until it reaches first or last slide. |
  | Wrap | wrap slides, cycles without stopping at first or last slide. |
  ```

  *Note that only invoking the component in a template as shown above is considered part of its public API. Extending from it (subclassing) is generally not supported, and may break at any time.*

  @class Carousel
  @namespace Components
  @extends Ember.Component
  @public
*/
@tagName('')
@deprecateSubclassing
export default class Carousel extends Component.extend(ComponentParent) {
  tabindex = '1';

  /**
   * @property slideComponent
   * @type {String}
   * @private
   */

  /**
   * If a slide can turn to left, including corners.
   *
   * @private
   * @property canTurnToLeft
   */
  @computed('wrap', 'currentIndex')
  get canTurnToLeft() {
    return this.wrap || this.currentIndex > 0;
  }

  /**
   * If a slide can turn to right, including corners.
   *
   * @private
   * @property canTurnToRight
   */
  @computed('childSlides.length', 'wrap', 'currentIndex')
  get canTurnToRight() {
    return this.wrap || this.currentIndex < this.childSlides.length - 1;
  }

  /**
   * All `CarouselSlide` child components.
   *
   * @private
   * @property childSlides
   * @readonly
   * @type array
   */
  @(filter('children', function (view) {
    return view instanceof CarouselSlide;
  }).readOnly())
  childSlides;

  /**
   * This observer is the entry point for real time insertion and removing of slides.
   *
   * @private
   * @property childSlidesObserver
   */
  @observes('childSlides.[]', 'autoPlay')
  childSlidesObserver() {
    scheduleOnce('actions', this, this._childSlidesObserver);
  }

  _childSlidesObserver() {
    let childSlides = this.childSlides;
    if (childSlides.length === 0) {
      return;
    }
    // Sets new current index
    let currentIndex = this.currentIndex;
    if (currentIndex >= childSlides.length) {
      currentIndex = childSlides.length - 1;
      this.set('currentIndex', currentIndex);
    }
    // Automatic sliding
    if (this.autoPlay) {
      this.waitIntervalToInitCycle.perform();
    }
    // Initial slide state
    this.set('presentationState', null);
  }

  /**
   * Indicates the current index of the current slide.
   *
   * @property currentIndex
   * @private
   */
  @defaultValue
  currentIndex = this.index;

  /**
   * The current slide object that is going to be used by the nested slides components.
   *
   * @property currentSlide
   * @private
   *
   */
  @(computed('childSlides', 'currentIndex').readOnly())
  get currentSlide() {
    return this.childSlides.objectAt(this.currentIndex);
  }

  /**
   * Bootstrap style to indicate that a given slide should be moving to left/right.
   *
   * @property directionalClassName
   * @private
   * @type string
   */
  @defaultValue
  directionalClassName = null;

  /**
   * Indicates the next slide index to move into.
   *
   * @property followingIndex
   * @private
   * @type number
   */
  @defaultValue
  followingIndex = null;

  /**
   * The following slide object that is going to be used by the nested slides components.
   *
   * @property followingIndex
   * @private
   */
  @(computed('childSlides', 'followingIndex').readOnly())
  get followingSlide() {
    return this.childSlides.objectAt(this.followingIndex);
  }

  /**
   * @private
   * @property hasInterval
   * @type boolean
   */
  @(gt('interval', 0).readOnly())
  hasInterval;

  /**
   * This observer is the entry point for programmatically slide changing.
   *
   * @property indexObserver
   * @private
   */
  @observes('index')
  indexObserver() {
    this.send('toSlide', this.index);
  }

  /**
   * @property indicators
   * @private
   */
  @computed('childSlides.length')
  get indicators() {
    return [...Array(this.childSlides.length)];
  }

  /**
   * If user is hovering its cursor on component.
   * This property is only manipulated when 'pauseOnMouseEnter' is true.
   *
   * @property isMouseHovering
   * @private
   * @type boolean
   */
  @defaultValue
  isMouseHovering = false;

  /**
   * The class name to append to the next control link element.
   *
   * @property nextControlClassName
   * @type string
   * @private
   */

  /**
   * Bootstrap style to indicate the next/previous slide.
   *
   * @property orderClassName
   * @private
   * @type string
   */

  /**
   * The current state of the current presentation, can be either "didTransition"
   * or "willTransit".
   *
   * @private
   * @property presentationState
   * @type string
   */
  @defaultValue
  presentationState = null;

  /**
   * The class name to append to the previous control link element.
   *
   * @property prevControlClassName
   * @type string
   * @private
   */

  /**
   * @private
   * @property shouldNotDoPresentation
   * @type boolean
   */
  @lte('childSlides.length', 1)
  shouldNotDoPresentation;

  /**
   * @private
   * @property shouldRunAutomatically
   * @type boolean
   */
  @readOnly('hasInterval')
  shouldRunAutomatically;

  /**
   * Starts automatic sliding on page load.
   * This parameter has no effect if interval is less than or equal to zero.
   *
   * @default false
   * @property autoPlay
   * @public
   * @type boolean
   */
  @defaultValue
  autoPlay = false;

  /**
   * If false will hard stop on corners, i.e., first slide won't make a transition to the
   * last slide and vice versa.
   *
   * @default true
   * @property wrap
   * @public
   * @type boolean
   */
  @defaultValue
  wrap = true;

  /**
   * Index of starting slide.
   *
   * @default 0
   * @property index
   * @public
   * @type number
   */
  @defaultValue
  index = 0;

  /**
   * Waiting time before automatically show another slide.
   * Automatic sliding is canceled if interval is less than or equal to zero.
   *
   * @default 5000
   * @property interval
   * @public
   * @type number
   */
  @defaultValue
  interval = 5000;

  /**
   * Should bind keyboard events into sliding.
   *
   * @default true
   * @property keyboard
   * @public
   * @type boolean
   */
  @defaultValue
  keyboard = true;

  /**
   * If automatic sliding should be left-to-right or right-to-left.
   * This parameter has no effect if interval is less than or equal to zero.
   *
   * @default true
   * @property ltr
   * @public
   * @type boolean
   */
  @defaultValue
  ltr = true;

  /**
   * The next control icon to be displayed.
   *
   * @default null
   * @property nextControlIcon
   * @type string
   * @public
   */

  /**
   * Label for screen readers, defaults to 'Next'.
   *
   * @default 'Next'
   * @property nextControlLabel
   * @type string
   * @public
   */
  @defaultValue
  nextControlLabel = 'Next';

  /**
   * Pauses automatic sliding if mouse cursor is hovering the component.
   * This parameter has no effect if interval is less than or equal to zero.
   *
   * @default true
   * @property pauseOnMouseEnter
   * @public
   * @type boolean
   */
  @defaultValue
  pauseOnMouseEnter = true;

  /**
   * The previous control icon to be displayed.
   *
   * @default null
   * @property prevControlIcon
   * @type string
   * @public
   */

  /**
   * Label for screen readers, defaults to 'Previous'.
   *
   * @default 'Previous'
   * @property prevControlLabel
   * @type string
   * @public
   */
  @defaultValue
  prevControlLabel = 'Previous';

  /**
   * Show or hide controls.
   *
   * @default true
   * @property showControls
   * @public
   * @type boolean
   */
  @defaultValue
  showControls = true;

  /**
   * Show or hide indicators.
   *
   * @default true
   * @property showIndicators
   * @public
   * @type boolean
   */
  @defaultValue
  showIndicators = true;

  /**
   * The duration of the slide transition.
   * You should also change this parameter in Bootstrap CSS file.
   *
   * @default 600
   * @property transitionDuration
   * @public
   * @type number
   */
  @defaultValue
  transitionDuration = 600;

  /**
   * The type slide transition to perform.
   * Options are 'fade' or 'slide'. Note: BS4 only
   *
   * @default 'slide'
   * @property transition
   * @public
   * @type string
   */
  @defaultValue
  transition = 'slide';

  @(equal('transition', 'fade').readOnly())
  carouselFade;

  /**
   * Action called after the slide has changed.
   *
   * @event onSlideChanged
   * @param toIndex
   * @public
   */
  onSlideChanged(toIndex) {} // eslint-disable-line no-unused-vars

  /**
   * Do a presentation and calls itself to perform a cycle.
   *
   * @method cycle
   * @private
   */
  @(task(function* () {
    yield this.transitioner.perform();
    yield timeout(this.interval);
    this.toAppropriateSlide();
  }).restartable())
  cycle;

  /**
   * @method transitioner
   * @private
   */
  @(task(function* () {
    this.set('presentationState', 'willTransit');
    yield timeout(this.transitionDuration);
    this.set('presentationState', 'didTransition');
    // Must change current index after execution of 'presentationStateObserver' method
    // from child components.
    yield new RSVP.Promise((resolve) => {
      schedule('afterRender', this, function () {
        this.set('currentIndex', this.followingIndex);
        resolve();
      });
    });
  }).drop())
  transitioner;

  /**
   * Waits an interval time to start a cycle.
   *
   * @method waitIntervalToInitCycle
   * @private
   */
  @(task(function* () {
    if (this.shouldRunAutomatically === false) {
      return;
    }
    yield timeout(this.interval);
    this.toAppropriateSlide();
  }).restartable())
  waitIntervalToInitCycle;

  @action
  toSlide(toIndex) {
    if (this.currentIndex === toIndex || this.shouldNotDoPresentation) {
      return;
    }
    this.assignClassNameControls(toIndex);
    this.setFollowingIndex(toIndex);
    if (this.shouldRunAutomatically === false || this.isMouseHovering) {
      this.transitioner.perform();
    } else {
      this.cycle.perform();
    }
    this.onSlideChanged(toIndex);
  }

  @action
  toNextSlide() {
    if (this.canTurnToRight) {
      this.send('toSlide', this.currentIndex + 1);
    }
  }

  @action
  toPrevSlide() {
    if (this.canTurnToLeft) {
      this.send('toSlide', this.currentIndex - 1);
    }
  }

  /**
   * Indicates what class names should be applicable to the current transition slides.
   *
   * @method assignClassNameControls
   * @private
   */
  assignClassNameControls(toIndex) {
    if (toIndex < this.currentIndex) {
      this.set('directionalClassName', 'right');
      this.set('orderClassName', 'prev');
    } else {
      this.set('directionalClassName', 'left');
      this.set('orderClassName', 'next');
    }
  }

  /**
   * Initial page loading configuration.
   */
  // eslint-disable-next-line ember/no-component-lifecycle-hooks
  didInsertElement() {
    super.didInsertElement(...arguments);
    this.triggerChildSlidesObserver();
  }

  @action
  handleMouseEnter() {
    if (this.pauseOnMouseEnter) {
      this.set('isMouseHovering', true);
      this.cycle.cancelAll();
      this.waitIntervalToInitCycle.cancelAll();
    }
  }

  @action
  handleMouseLeave() {
    if (this.pauseOnMouseEnter && (this.transitioner.last !== null || this.waitIntervalToInitCycle.last !== null)) {
      this.set('isMouseHovering', false);
      this.waitIntervalToInitCycle.perform();
    }
  }

  @action
  handleKeyDown(e) {
    let code = e.keyCode || e.which;
    if (this.keyboard === false || /input|textarea/i.test(e.target.tagName)) {
      return;
    }
    switch (code) {
      case 37:
        this.send('toPrevSlide');
        break;
      case 39:
        this.send('toNextSlide');
        break;
      default:
        break;
    }
  }

  /**
   * Sets the following slide index within the lower and upper bounds.
   *
   * @method setFollowingIndex
   * @private
   */
  setFollowingIndex(toIndex) {
    let slidesLengthMinusOne = this.childSlides.length - 1;
    if (toIndex > slidesLengthMinusOne) {
      this.set('followingIndex', 0);
    } else if (toIndex < 0) {
      this.set('followingIndex', slidesLengthMinusOne);
    } else {
      this.set('followingIndex', toIndex);
    }
  }

  /**
   * Coordinates the correct slide movement direction.
   *
   * @method toAppropriateSlide
   * @private
   */
  toAppropriateSlide() {
    if (this.ltr) {
      this.send('toNextSlide');
    } else {
      this.send('toPrevSlide');
    }
  }

  /**
   * @method triggerChildSlidesObserver
   * @private
   */
  triggerChildSlidesObserver() {
    this.childSlides;
  }
}
