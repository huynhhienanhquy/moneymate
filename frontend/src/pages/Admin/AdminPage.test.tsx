import { expectPageToRender } from '@/test/pageTest';
import AdminPage from './AdminPage';
it('renders the admin page', () => expectPageToRender(AdminPage, 'Quản lý người dùng'));
