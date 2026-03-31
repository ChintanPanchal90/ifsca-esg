export type Issuer = {
  id: number;
  name: string;
  type: string;
  country: string;
  website: string;
  created_at: string;
};

export type Instrument = {
  id: number;
  issuer_id: number;
  instrument_type: string;
  title: string;
  amount_usd: number;
  original_currency: string;
  original_amount: number;
  issue_date: string;
  maturity_date: string;
  esg_standard: string;
  arranger: string;
  sector: string;
  status: string;
  created_at: string;
  issuers?: Issuer;
};

export type Loan = {
  id: number;
  bank_name: string;
  loan_category: string;
  amount_usd: number;
  sector: string;
  borrower_type: string;
  esg_methodology: string;
  disbursement_date: string;
  created_at: string;
};

export type Fund = {
  id: number;
  fund_name: string;
  fund_manager: string;
  strategy: string;
  aum_usd: number;
  domicile: string;
  esg_methodology: string;
  sectors: string[];
  created_at: string;
};

export type Disclosure = {
  id: number;
  instrument_id: number;
  disclosure_type: string;
  title: string;
  year: number;
  file_url: string;
  notes: string;
  created_at: string;
};

export type Rating = {
  id: number;
  instrument_id: number;
  has_rating: boolean;
  agency: string;
  rating_value: string;
  rated_on: string;
  created_at: string;
};
