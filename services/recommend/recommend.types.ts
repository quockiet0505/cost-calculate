

export type RecommendRequest = {
     postcode: string;
     usage: any;
   };
   
   export type RecommendedPlan = {
     retailer: string;
     planId: string;
     finalTotal: number;
     reasons: string[];   
   };
   
   export type RecommendResponse = {
     postcode: string;
     count: number;
     recommended: RecommendedPlan[];
   };
   