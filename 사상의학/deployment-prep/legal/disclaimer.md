# 의료 면책 고지 (Medical Disclaimer)

## 결과 페이지 노출용 표준 문구

> ※ 본 결과는 사상의학 자가진단을 위한 **참고 자료**이며, 의학적 진단이 아닙니다.
>
> 정확한 체질 감별과 처방은 한의사의 직접적인 진료와 사진(四診)을 통해 이루어지며,
> 본 결과만으로 자의적으로 약재를 복용하거나 치료를 시작하지 마시기 바랍니다.
>
> 건강 상태에 변화가 있거나 증상이 지속되는 경우, 반드시 한의원이나 의료기관에
> 방문하여 전문 진료를 받으시기 바랍니다.

## 짧은 버전 (배너·푸터용)

> 본 결과는 참고용이며 의학적 진단이 아닙니다. 정확한 진단은 한의사와 상담하세요.

## 영문 (선택)

> The result above is provided for **educational and reference purposes only** and
> does not constitute medical advice or diagnosis. Sasang Constitutional Medicine
> evaluation requires direct clinical examination by a licensed Korean Medicine doctor.
>
> Please consult a qualified practitioner before making any health decisions based on
> this result.

---

## 사용처 가이드

| 위치 | 버전 | 노출 방식 |
|---|---|---|
| `/result/[id]` (결과 페이지) | 표준 문구 (한국어) | 상·하단 박스 |
| `/quiz` 시작 페이지 | 표준 문구 (한국어) | 시작 버튼 위 |
| `/guide/[constitution]` (섭생) | 짧은 버전 | 푸터 |
| 처방·본초 페이지 (한의사용) | 짧은 버전 | 사이드바 |
| 글로벌 푸터 | 짧은 버전 | 전체 사이트 |

## 컴포넌트 예시 (참고용 코드)

```tsx
// components/disclaimer.tsx
export function Disclaimer({ variant = "long" }: { variant?: "long" | "short" }) {
  if (variant === "short") {
    return (
      <p className="text-xs text-stone-500">
        본 결과는 참고용이며 의학적 진단이 아닙니다. 정확한 진단은 한의사와 상담하세요.
      </p>
    );
  }
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">※ 의료 면책 고지</p>
      <p className="mt-2 leading-relaxed">
        본 결과는 사상의학 자가진단을 위한 참고 자료이며, 의학적 진단이 아닙니다.
        정확한 체질 감별과 처방은 한의사의 직접적인 진료와 사진(四診)을 통해
        이루어지며, 본 결과만으로 자의적으로 약재를 복용하거나 치료를 시작하지
        마시기 바랍니다.
      </p>
    </div>
  );
}
```
