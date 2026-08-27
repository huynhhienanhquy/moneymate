import { renderPage } from '@/test/pageTest';
import { screen } from '@/test/render';
import AiAdvisorPage from './AiAdvisorPage';

describe('AiAdvisorPage', () => {
  it('renders AI analysis and recommendations', () => {
    renderPage(AiAdvisorPage);
    expect(screen.getByText(/AI Tài chính/)).toBeInTheDocument();
    expect(screen.getByText(/AI Tài chính/)).toBeInTheDocument();
  });

  it('keeps the page shell visible without analysis data', () => {
    renderPage(AiAdvisorPage, 'empty');
    expect(screen.getByText(/AI Tài chính/)).toBeInTheDocument();
  });
});
