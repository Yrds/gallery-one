import { GalleryComponent } from './GalleryComponent';

const assureBetween = (input: number, limit: number) : number => {
  if(input > limit) return limit;
  if(input < -limit) return -limit;
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
  private componentList: Array<GalleryComponent> = [];
  private defaultParent: HTMLElement;
  private mainElement: Element;
  private selector: string;
  private slideSelected: number = 0;
  private slideContainers: NodeListOf<SlideContainerElement>;
  private buttonNext: HTMLDivElement | null;
  private buttonPrev: HTMLDivElement | null;

  constructor(selector: string, options?: GalleryOptions) {
    this.defaultParent = (options && options.defaultParent ? options.defaultParent : undefined) || document.body;

    this.selector = selector;

    const mainElement = this.defaultParent.querySelector(this.selector);

    if(mainElement) {
      this.mainElement = mainElement;
    } else {
      throw Error("No element with selector " + this.selector + " found on " + this.defaultParent);
    }

    this.slideContainers = this.defaultParent.querySelectorAll(this.selector + " > .slide-container");

    this.setupElements();
    this.setupButtons();
  }

  private setupElements() {
    if(this.mainElement) {
      this.mainElement.classList.add('image-gallery');
    }
  }

  public addComponent(component: GalleryComponent) {
    this.componentList.push(component);
    component.init(this);
  }

  private setupButtons() {
    //TODO make this a component
    this.buttonNext = this.mainElement.querySelector('.slide-button-next');

    if(this.buttonNext) {
      this.buttonNext.addEventListener('click', () => {
        this.nextSlide();
      });
    }

    //TODO make this a component
    this.buttonPrev = this.mainElement.querySelector('.slide-button-next');

    if(this.buttonPrev) {
      this.buttonPrev.addEventListener('click', () => {
        this.prevSlide();
      });
    }

    //TODO make this a component
    this.mainElement.addEventListener('dblclick', () => {
      this.zoomSlide();
    });

  }

  private getTransformByElement(element: SlideContainerElement | undefined): TransformData {

    const slideContainerImage = element ? (element.querySelector('img') as SlideContainerImageElement) : undefined;

    if(slideContainerImage && slideContainerImage.transformData) {
      return slideContainerImage.transformData;
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

  private updateTransformByElement(transformData: TransformData, element: HTMLElement | undefined): void {
    const slideContainerImage = element ? (element.querySelector('img') as SlideContainerImageElement) : undefined;

    if(slideContainerImage) {
      slideContainerImage.transformData = transformData;

      let transformString: string = "";
      transformString += "translate(" + transformData.position.x + "%, " + transformData.position.y + "%) ";
      transformString += "rotate("+ transformData.rotation + "deg) ";
      transformString += "scale("+ transformData.scale + ")";

      slideContainerImage.style.transform = transformString;
    }
  }

  updateTransformByIndex(transformData: TransformData, slideSelected: number): void {
    this.updateTransformByElement(transformData, this.slideContainers[slideSelected]);
  }

  nextSlide(params?: {
    reverse?: boolean,
    selected?: number
  }) {
    const reverse: boolean = params && params.reverse || false;
    const selected: number | undefined = params ? params.selected : undefined;

    if(selected || selected == 0) {
      this.slideSelected = Math.abs(selected % this.slideContainers.length);
    } else {
      this.slideSelected = (this.slideSelected + ( reverse ? -1 : 1) + this.slideContainers.length) % this.slideContainers.length;
    }

    this.slideContainers.forEach((container) => {
      container.classList.remove('container-selected');
    });

    const selectedSlide = this.slideContainers[this.slideSelected];

    if(selectedSlide) {
      selectedSlide.classList.add('container-selected');
    }

    this.mainElement.dispatchEvent(createEvent('slideChangeEvent', { detail: {reverse, slideSelected: this.slideSelected}}));
  }

  public prevSlide() {
    this.nextSlide({reverse: true});
  }

  


  private getClientMove(event: MouseEvent | TouchEvent): ClientMove {
    const changedTouches = (event as TouchEvent).changedTouches[0];

    if(changedTouches) {
      return { x: changedTouches.clientX, y: changedTouches.clientY };
    } else {
      const mouseEvent = (event as MouseEvent);
      return {x: mouseEvent.clientX, y: mouseEvent.clientX};
    }
  };

  private mouseDown(event: MouseEvent | TouchEvent): void {

    event.preventDefault();

    const container = event.currentTarget as SlideContainerElement;

    //TODO
    //const zoomActive: boolean = container.classList.contains('zoom-active');

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

      const newX = assureBetween(clientMove.x - container.dragPosition.x, limitPosition);
      const newY = assureBetween(clientMove.y - container.dragPosition.y, limitPosition);

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

    if(container) {
      container.dragPosition = undefined;
    }

    event.preventDefault();
  }

  public zoomSlide() {
    const container = this.slideContainers[this.slideSelected];

    if(!container){
      throw Error("Container not selected. This should not happen, contact the developers.");
    }

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
