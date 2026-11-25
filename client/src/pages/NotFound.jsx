import { Link } from 'react-router-dom';
import { Empty } from '../components/ui';

export default function NotFound() {
  return (
    <div className="container page">
      <Empty
        title="This page does not exist"
        text="The link may be broken or the page was moved."
        action={<Link to="/" className="btn btn-primary">Go to the home page</Link>}
      />
    </div>
  );
}
