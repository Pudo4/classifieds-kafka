import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/layout.js';
import { FeedPage } from './pages/feed-page.js';
import { ListingCardPage } from './pages/listing-card-page.js';
import { CreateListingPage } from './pages/create-listing-page.js';
import { MyListingsPage } from './pages/my-listings-page.js';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<FeedPage />} />
        <Route path="listings/:id" element={<ListingCardPage />} />
        <Route path="create" element={<CreateListingPage />} />
        <Route path="mine" element={<MyListingsPage />} />
      </Route>
    </Routes>
  );
}
