export const DEFAULT_SAMPLE_CSV = `name,email,age,country
Alice Smith,alice@example.com,30,USA
Bob Johnson,bob@example.org,25,Canada
Charlie Brown,charlie@example.co.uk,35,United Kingdom
Diana Prince,diana@example.io,28,Australia`;

export const DEFAULT_SAMPLE_JSON = JSON.stringify([
  {
    name: 'Alice Smith',
    email: 'alice@example.com',
    age: '30',
    country: 'USA'
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.org',
    age: '25',
    country: 'Canada'
  },
  {
    name: 'Charlie Brown',
    email: 'charlie@example.co.uk',
    age: '35',
    country: 'United Kingdom'
  },
  {
    name: 'Diana Prince',
    email: 'diana@example.io',
    age: '28',
    country: 'Australia'
  }
], null, 2);
