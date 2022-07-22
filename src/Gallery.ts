const assureBetween = (input: number, limit: number) : number => {
  if(input > limit) return limit;
  if(input < limit) return -limit;
  return input;
}

interface ClientMove {
  x: number;
  y: number;
};

const createEvent = function(event: string, params?: { bubbles?: boolean, cancelable?: boolean, detail: any}) {
  params = params || { bubbles: false, cancelable: false, detail: undefined };
  const evt = document.createEvent('CustomEvent');
  evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
  return evt;
};

interface RotateOptions {
  rotateRight?: boolean;
};

interface SlideContainerElement extends HTMLElement {
  dragPosition?: {x: number, y: number};
};

interface TransformData {
  position: {x: number, y:number};
  rotation: number;
  scale: number;
};

interface SlideContainerImageElement extends HTMLImageElement {
  transformData?: TransformData;
};

interface GalleryOptions {
  defaultParent: HTMLElement;
};

export class Gallery {
  private defaultParent: HTMLElement;
  private mainElement: HTMLElement;
  private selector: string;
  private slideSelected: number = 0;
  private slideContainers: NodeListOf<SlideContainerElement>;
  private buttonNext?: HTMLDivElement;
  private buttonPrev?: HTMLDivElement;

  constructor(selector: string, options: GalleryOptions) {
    this.defaultParent = options.defaultParent || document.body;

    this.selector = selector;

    this.mainElement = this.defaultParent.querySelector(this.selector);

    this.slideContainers = this.defaultParent.querySelectorAll(this.selector + " > .slide-container");

    this.setupElements();
    this.setupButtons();
  }

  private setupElements() {
    this.mainElement.classList.add('image-gallery');
  }

  private setupButtons() {
    this.buttonNext = this.mainElement.querySelector('.slide-button-next');
    this.buttonNext.addEventListener('click', () => {
      this.nextSlide();
    });

    this.buttonPrev = this.mainElement.querySelector('.slide-button-next');
    this.buttonPrev.addEventListener('click', () => {
      this.prevSlide();
    });

    this.mainElement.addEventListener('dblclick', () => {
      this.zoomSlide();
    });

  }

  private getTransformByElement(element: HTMLElement): TransformData {
    const transformData = (element.querySelector('img') as SlideContainerImageElement).transformData;

    if(transformData) {
      return transformData;
    }

    return {
      position: {x: 0, y:0},
      rotation: 0,
      scale: 1
    };
  }

  private getTransformByIndex(slideSelected: number): TransformData {
    return this.getTransformByElement(this.slideContainers[slideSelected]);
  }

  private updateTransformByElement(transformData: TransformData, element: HTMLElement): void {
    const slideContainerImage = (element.querySelector('img') as SlideContainerImageElement);

    slideContainerImage.transformData = transformData;

    let transformString: string = "";
    transformString += "translate(" + transformData.position.x + "%, " + transformData.position.y + "%) ";
    transformString += "rotate("+ transformData.rotation + "deg) ";
    transformString += "scale("+ transformData.scale + ")";

    slideContainerImage.style.transform = transformString;
  }

  updateTransformByIndex(transformData: TransformData, slideSelected: number): void {
    this.updateTransformByElement(transformData, this.slideContainers[slideSelected]);
  }

  nextSlide(params?: {
    reverse?: boolean,
    selected?: number
  }) {
    const reverse: boolean = params.reverse || false;
    const selected: number | undefined = params.selected;

    if(selected || selected == 0) {
      this.slideSelected = Math.abs(params.selected % this.slideContainers.length);
    } else {
      this.slideSelected = (this.slideSelected + ( reverse ? -1 : 1) + this.slideContainers.length) % this.slideContainers.length;
    }

    this.slideContainers.forEach((container) => {
      container.classList.remove('container-selected');
    });

    this.slideContainers[this.slideSelected].classList.add('container-selected');

    this.mainElement.dispatchEvent(createEvent('slideChangeEvent', { detail: {reverse, slideSelected: this.slideSelected}}));

  }

  public prevSlide() {
    this.nextSlide({reverse: true});
  }

  


  private getClientMove(event: MouseEvent | TouchEvent): ClientMove {
    const touch: {clientX: number, clientY: number} = (event.type === "TouchEvent") ? (event as TouchEvent).changedTouches[0] : {clientX: undefined, clientY: undefined};

    const x = touch.clientX || (event as MouseEvent).clientX;
    const y = touch.clientY || (event as MouseEvent).clientY;

    return {x, y};
  };

  private mouseDown(event: MouseEvent | TouchEvent): void {

    event.preventDefault();

    const container = event.currentTarget as SlideContainerElement;

    const zoomActive: boolean = container.classList.contains('zoom-active');

    const transformData = this.getTransformByElement(container);

    const clientMove = this.getClientMove(event);


    container.dragPosition = {
      x: clientMove.x - transformData.position.x,
      y: clientMove.y - transformData.position.y
    };
  }

  private mouseMove(event: MouseEvent | TouchEvent): void {
    const container = event.currentTarget as SlideContainerElement;

    if(container.dragPosition) {
      const transformData = this.getTransformByElement(container);

      const clientMove = this.getClientMove(event);

      const limitPosition: number = 100;

      const newX = assureBetween(clientMove.x - container.dragPosition.x, 100);
      const newY = assureBetween(clientMove.y - container.dragPosition.y, 100);

      transformData.position = {
        x: newX,
        y: newY
      };

      this.updateTransformByElement(transformData, container);
    }

    event.preventDefault();
  }

  private mouseUp(event: MouseEvent | TouchEvent) {
    const container = event.currentTarget as SlideContainerElement;

    container.dragPosition = null;

    event.preventDefault();
  }

  public zoomSlide() {
    const container = this.slideContainers[this.slideSelected];

    const containerTransform = this.getTransformByElement(container);

    const zoomActive = container.classList.contains('zoom-active');

    if(!zoomActive) {
      container.classList.add('zoom-active');

      containerTransform.scale = 2.2;

      //TODO only add this event if it's a desktop browser
      container.addEventListener('mousedown', this.mouseDown);
      container.addEventListener('mousemove', this.mouseMove);
      container.addEventListener('mouseup', this.mouseUp);

      //TODO only add this event if it's a mobile browser
      container.addEventListener('touchstart', this.mouseDown);
      container.addEventListener('touchmove', this.mouseMove);
      container.addEventListener('touchend', this.mouseUp);
    } else {

      //TODO only add this event if it's a desktop browser
      container.removeEventListener('mousedown', this.mouseDown);
      container.removeEventListener('mousemove', this.mouseMove);
      container.removeEventListener('mouseup', this.mouseUp);


      //TODO only remove this event if it's a mobile browser
      container.removeEventListener('touchstart', this.mouseDown);
      container.removeEventListener('touchmove', this.mouseMove);
      container.removeEventListener('touchend', this.mouseUp);

      containerTransform.scale = 1;

      container.classList.remove('zoom-active');

      containerTransform.position = { x: 0, y: 0 };

    }

    this.updateTransformByElement(containerTransform, container);
  }

  public rotateSlide(options: RotateOptions) {
    const rotateRight = options.rotateRight || false;

    const containerTransform = this.getTransformByIndex(this.slideSelected);

    containerTransform.rotation += rotateRight ? 90 : -90;

    this.updateTransformByIndex(containerTransform, this.slideSelected);
  }
};
