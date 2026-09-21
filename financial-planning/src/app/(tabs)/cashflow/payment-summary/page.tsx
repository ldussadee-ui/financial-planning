import { Suspense } from "react";
import { PaymentSummaryView } from "@/components/tabs/PaymentSummaryView";

// PaymentSummaryView reads ?cycle= with useSearchParams, which cannot be
// known while prerendering. Without a Suspense boundary above it this
// version of Next treats that as a blocking prerender error; with one, the
// shell still prerenders and the view renders on the client. The fallback
// is empty because the view itself renders nothing until its data loads.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <PaymentSummaryView />
    </Suspense>
  );
}
