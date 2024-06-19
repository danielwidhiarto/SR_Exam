// specifications.ts
export interface Specification<T> {
    isSatisfiedBy(item: T): boolean;
  }
  
  export class DateSpecification implements Specification<ViewTransaction> {
    private date: string;
    
    constructor(date: string) {
      this.date = date;
    }
  
    isSatisfiedBy(item: ViewTransaction): boolean {
      return item.date === this.date;
    }
  }
  
  export class RoomSpecification implements Specification<ViewTransaction> {
    private room: string;
  
    constructor(room: string) {
      this.room = room;
    }
  
    isSatisfiedBy(item: ViewTransaction): boolean {
      return item.room_number === this.room;
    }
  }
  
  export class SubjectSpecification implements Specification<ViewTransaction> {
    private subjectCode: string;
  
    constructor(subjectCode: string) {
      this.subjectCode = subjectCode;
    }
  
    isSatisfiedBy(item: ViewTransaction): boolean {
      return item.subject_codes === this.subjectCode;
    }
  }
  
  export class CompositeSpecification<T> implements Specification<T> {
    private specifications: Specification<T>[];
  
    constructor(...specifications: Specification<T>[]) {
      this.specifications = specifications;
    }
  
    isSatisfiedBy(item: T): boolean {
      return this.specifications.every(spec => spec.isSatisfiedBy(item));
    }
  }
  