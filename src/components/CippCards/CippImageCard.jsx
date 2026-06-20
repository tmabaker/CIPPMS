import NextLink from "next/link";
import ArrowRightIcon from "@heroicons/react/24/outline/ArrowRightIcon";
import { Box, Button, LinearProgress, Skeleton, Stack, SvgIcon, Typography } from "@mui/material";

// Links that aren't Next.js routes (auth/platform endpoints, absolute URLs) must
// trigger a full-page browser navigation. Routing them through NextLink results in
// a client-side transition to a non-existent route, so the click appears to do nothing.
const isExternalLink = (link) =>
  typeof link === "string" &&
  (/^(https?:)?\/\//.test(link) || link.startsWith("mailto:") || link.startsWith("/.auth/"));

export const CippImageCard = ({
  isFetching,
  imageUrl = "/assets/illustration-reports.png",
  title,
  text,
  step,
  maxstep,
  linkText,
  link,
  onButtonClick,
}) => (
  <Stack
    alignItems="center"
    direction="row"
    spacing={3}
    sx={{
      backgroundColor: "neutral.900",
      borderRadius: 1,
      color: "common.white",
      px: 4,
      py: 2,
    }}
  >
    <div>
      <Typography color="inherit" variant="h4">
        {title}
      </Typography>
      <Typography color="inherit" sx={{ mt: 2 }}>
        {isFetching ? <Skeleton width={"500px"} sx={{ height: 80 }} /> : text}
      </Typography>
      <Stack alignItems="center" direction="row" spacing={2} sx={{ my: 3 }}>
        {step && maxstep && (
          <>
            <Typography color="inherit" variant="subtitle2">
              {step}/{maxstep}
            </Typography>
            <LinearProgress
              sx={{
                borderRadius: 1,
                flexGrow: 1,
                height: "8px",
              }}
              value={(step / maxstep) * 100}
              variant="determinate"
            />
          </>
        )}
      </Stack>
      {link && (
        <Button
          {...(isExternalLink(link) ? { component: "a" } : { component: NextLink })}
          endIcon={
            <SvgIcon fontSize="small">
              <ArrowRightIcon />
            </SvgIcon>
          }
          href={link}
          variant="contained"
        >
          {linkText}
        </Button>
      )}
      {onButtonClick && (
        <Button
          endIcon={
            <SvgIcon fontSize="small">
              <ArrowRightIcon />
            </SvgIcon>
          }
          onClick={onButtonClick}
          variant="contained"
        >
          {linkText}
        </Button>
      )}
    </div>
    <Box
      sx={{
        "& img": {
          maxHeight: 350,
          width: "100%",
        },
      }}
    >
      <img src={imageUrl} />
    </Box>
  </Stack>
);
