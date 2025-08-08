export interface Calculation {
  id: string;
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  operands: number[];
  result?: number;
  createdAt: Date;
}
